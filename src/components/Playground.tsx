import { useState, useEffect } from 'react';
import { Box, Button, Container, Grid, Typography } from '@mui/material';
import EditorPanel from './EditorPanel';
import ResultPanel from './ResultPanel';
import { fetchEndpoints } from '../api';
import type { Endpoint, ScreenshotOptions, Preset, ClipProps } from '../types';
import GitHubIcon from '@mui/icons-material/GitHub';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const formatStarCount = (count: number) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return String(count);
};

const presetMetaModules = import.meta.glob('../presets/**/preset.json', {
  eager: true,
});

const presetTemplateModules = import.meta.glob('../presets/**/tmpl.html', {
  eager: true,
  as: 'raw',
});

const presetPreviewModules = import.meta.glob('../presets/**/preview.{webp,png,jpg,jpeg}', {
  eager: true,
});

const loadPresets = (): Preset[] => {
  const unwrap = (maybeMod: unknown) => {
    if (maybeMod && typeof maybeMod === 'object' && 'default' in (maybeMod as any)) {
      return (maybeMod as any).default;
    }
    return maybeMod;
  };

  return Object.entries(presetMetaModules)
    .map(([path, mod]) => {
      const dir = path.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
      const id = dir.split('/').pop() || path;
      const meta = unwrap(mod) || { preset_name: id };
      const templateModule = unwrap(presetTemplateModules[`${dir}/tmpl.html`]);
      const previewKey = Object.keys(presetPreviewModules).find(key => key.startsWith(`${dir}/preview.`));
      const previewModule = previewKey ? unwrap(presetPreviewModules[previewKey]) : undefined;

      return {
        id,
        meta,
        template: typeof templateModule === 'string' ? templateModule : '',
        preview: typeof previewModule === 'string' ? previewModule : undefined,
      } as Preset;
    })
    .filter(preset => preset.id !== 'helloworld');
};

const PRESETS = loadPresets();
function Playground() {
  const [template, setTemplate] = useState(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>{{ title }}</h1>
    <p>{{ content }}</p>
  </div>
</body>
</html>`);

  const [templateData, setTemplateData] = useState(`{
  "title": "Hello World",
  "content": "This is a test template"
}`);

  const [options, setOptions] = useState<ScreenshotOptions>({
    full_page: true,
    quality: 60,
    device_scale_factor_level: 'normal',
    omit_background: false,
    timeout: null,
    clip: null,
    animations: 'disabled',
  });

  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('');
  const [customEndpoint, setCustomEndpoint] = useState<string>('');
  const [clip, setClip] = useState<ClipProps | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    loadEndpoints();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadStarCount = async () => {
      try {
        const response = await fetch(
          'https://api.github.com/repos/AstrBotDevs/AstrBot',
          { signal: controller.signal }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (typeof data.stargazers_count === 'number') {
          setStarCount(data.stargazers_count);
        }
      } catch (err) {
        // ignore
      }
    };

    loadStarCount();

    return () => controller.abort();
  }, []);

  const loadEndpoints = async () => {
    try {
      const response = await fetchEndpoints();
      const activeEndpoints = response.data.filter(ep => ep.active);
      setEndpoints(activeEndpoints);
      if (activeEndpoints.length > 0) {
        setSelectedEndpoint(activeEndpoints[0].url);
      }
    } catch (err) {
      console.error('Failed to load endpoints:', err);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      let endpoint = selectedEndpoint;
      if (customEndpoint) {
        endpoint = customEndpoint;
      }

      if (!endpoint) {
        throw new Error('请选择或输入一个接口地址');
      }

      let parsedData: Record<string, any> = {};
      try {
        parsedData = JSON.parse(templateData);
      } catch (e) {
        throw new Error('模板数据 JSON 格式错误');
      }

      const { generateImage } = await import('../api');
      const blob = await generateImage(endpoint, {
        tmpl: template,
        tmpldata: parsedData,
        options: {
          ...options,
          type: options.omit_background ? 'png' : 'jpeg',
          timeout:
            options.timeout != null ? options.timeout * 1000 : options.timeout,
        },
        json: false,
      });

      const url = URL.createObjectURL(blob);
      setImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成图片失败');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset: Preset) => {
    setTemplate(preset.template || '');
    const data = preset.meta.tmpldata ?? {};
    setTemplateData(JSON.stringify(data, null, 2));
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography variant="h5" component="h1" fontWeight={500}>
          AstrBot Text2Image Playground
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<GitHubIcon fontSize="small" />}
          component="a"
          href="https://github.com/AstrBotDevs/AstrBot"
          target="_blank"
          rel="noreferrer"
          sx={{
            py: 0.5,
            px: 1.5,
            borderRadius: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
          }}
        >
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            GitHub
            {starCount !== null && (
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.25,
                  px: 0.75,
                  py: 0.25,
                  borderRadius: 1.5,
                  bgcolor: 'action.hover',
                  color: 'text.secondary',
                  fontSize: 12,
                  lineHeight: 1.2,
                }}
              >
                <StarBorderIcon sx={{ fontSize: 16 }} />
                {formatStarCount(starCount)}
              </Box>
            )}
          </Box>
        </Button>
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Container maxWidth={false} sx={{ height: '100%', py: 2 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              <EditorPanel
                template={template}
                templateData={templateData}
                options={options}
                endpoints={endpoints}
                selectedEndpoint={selectedEndpoint}
                customEndpoint={customEndpoint}
                clip={clip}
                onTemplateChange={setTemplate}
                onTemplateDataChange={setTemplateData}
                onOptionsChange={setOptions}
                onEndpointChange={setSelectedEndpoint}
                onCustomEndpointChange={setCustomEndpoint}
                onClipChange={setClip}
                onGenerate={handleGenerate}
                loading={loading}
                presets={PRESETS}
                onApplyPreset={handleApplyPreset}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ height: '100%' }}>
              <ResultPanel
                imageUrl={imageUrl}
                error={error}
                loading={loading}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Box
        component="footer"
        sx={{
          py: 1.5,
          px: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          textAlign: 'center',
          fontWeight: 500,
          color: 'text.secondary',
        }}
      >
        Made with 💙 by AstrBot Community
      </Box>
    </Box>
  );
}

export default Playground;

