import { useState } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Typography,
  Stack,
  Card,
  CardActionArea,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import { OpenInNew, PlayArrow, ContentCopy } from "@mui/icons-material";
import Editor from "@monaco-editor/react";
import type { ClipProps, Endpoint, Preset, ScreenshotOptions } from "../types";

interface EditorPanelProps {
  template: string;
  templateData: string;
  options: ScreenshotOptions;
  endpoints: Endpoint[];
  selectedEndpoint: string;
  customEndpoint: string;
  clip: ClipProps | null;
  onTemplateChange: (value: string) => void;
  onTemplateDataChange: (value: string) => void;
  onOptionsChange: (options: ScreenshotOptions) => void;
  onEndpointChange: (url: string) => void;
  onCustomEndpointChange: (url: string) => void;
  onClipChange: (clip: ClipProps | null) => void;
  onGenerate: () => void;
  loading: boolean;
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
}

function EditorPanel({
  template,
  templateData,
  options,
  endpoints,
  selectedEndpoint,
  customEndpoint,
  clip,
  onTemplateChange,
  onTemplateDataChange,
  onOptionsChange,
  onEndpointChange,
  onCustomEndpointChange,
  onClipChange,
  onGenerate,
  loading,
  presets,
  onApplyPreset,
}: EditorPanelProps) {
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<Preset | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "" });

  const handleOptionsChange = (key: keyof ScreenshotOptions, value: any) => {
    onOptionsChange({
      ...options,
      [key]: value,
    });
  };

  const handleClipChange = (key: keyof ClipProps, value: number) => {
    onClipChange({
      ...clip,
      [key]: value,
    } as ClipProps);
    handleOptionsChange("clip", {
      ...clip,
      [key]: value,
    } as ClipProps);
  };

  const handlePresetClick = (preset: Preset) => {
    if (template.trim()) {
      setPendingPreset(preset);
      setConfirmDialog(true);
    } else {
      applyPreset(preset);
    }
  };

  const applyPreset = (preset: Preset) => {
    onApplyPreset(preset);
    setTabValue(0); // 切换到 Jinja2 模板 tab
    setSnackbar({ open: true, message: "预设导入成功" });
  };

  const handleConfirmApply = () => {
    if (pendingPreset) {
      applyPreset(pendingPreset);
    }
    setConfirmDialog(false);
    setPendingPreset(null);
  };

  const handleCancelApply = () => {
    setConfirmDialog(false);
    setPendingPreset(null);
  };

  const handleCopyOptions = () => {
    // 转换为 Python 字典格式
    const pythonDict = convertToPythonDict(options);
    navigator.clipboard
      .writeText(pythonDict)
      .then(() => {
        setSnackbar({ open: true, message: "已复制 Python 字典格式到剪贴板" });
      })
      .catch(() => {
        setSnackbar({ open: true, message: "复制失败" });
      });
  };

  const convertToPythonDict = (opts: ScreenshotOptions): string => {
    const entries: string[] = [];

    if (opts.quality != null) {
      entries.push(`    "quality": ${opts.quality}`);
    }
    if (opts.timeout != null) {
      entries.push(`    "timeout": ${opts.timeout * 1000}`);
    }
    if (opts.device_scale_factor_level != null) {
      entries.push(
        `    "device_scale_factor_level": "${opts.device_scale_factor_level}"`,
      );
    }
    if (opts.full_page != null) {
      entries.push(`    "full_page": ${opts.full_page ? "True" : "False"}`);
    }
    if (opts.omit_background != null) {
      entries.push(
        `    "omit_background": ${opts.omit_background ? "True" : "False"}`,
      );
      entries.push(`    "type": "${opts.omit_background ? "png" : "jpeg"}"`);
    } else {
      entries.push(`    "type": "jpeg"`);
    }

    if (opts.animations != null) {
      entries.push(
        `    "animations": "${opts.animations === "allow" ? "allow" : "disabled"}"`,
      );
    }
    if (opts.clip) {
      entries.push(
        `    "clip": {\n` + 
          `        "x": ${opts.clip.x},\n` +
          `        "y": ${opts.clip.y},\n` +
          `        "width": ${opts.clip.width},\n` +
          `        "height": ${opts.clip.height}\n` +
          `    }`
      );
    }

    return `{\n${entries.join(",\n")}\n}`;
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Paper
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            borderBottom: 1,
            borderColor: "divider",
            px: 2,
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ minHeight: 48 }}
          >
            <Tab label="Jinja2 模板" />
            <Tab label="模板数据" />
            <Tab label="选项配置" />
            <Tab label="预设" />
          </Tabs>

          <Button
            size="small"
            startIcon={<OpenInNew fontSize="small" />}
            component="a"
            href="https://docs.astrbot.app/dev/star/guides/html-to-pic.html"
            target="_blank"
            rel="noreferrer"
            sx={{ whiteSpace: "nowrap" }}
          >
            在插件使用
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflow: "hidden" }}>
          {tabValue === 3 && (
            <Box sx={{ p: 2, overflow: "auto", height: "100%" }}>
              {presets.length ? (
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  {presets.map((preset) => (
                    <Card
                      key={preset.id}
                      sx={{ width: 220 }}
                      variant="outlined"
                    >
                      <CardActionArea onClick={() => handlePresetClick(preset)}>
                        {preset.preview ? (
                          <Box
                            component="img"
                            src={preset.preview}
                            alt={preset.meta.preset_name}
                            sx={{
                              width: "100%",
                              height: 120,
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: "100%",
                              height: 120,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: "action.hover",
                              color: "text.secondary",
                              fontSize: 14,
                            }}
                          >
                            无预览
                          </Box>
                        )}
                        <Box sx={{ p: 1.5 }}>
                          <Typography variant="subtitle1" noWrap>
                            {preset.meta.preset_name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {preset.meta.description || "点击应用此预设"}
                          </Typography>
                        </Box>
                      </CardActionArea>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Box
                  sx={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "text.secondary",
                  }}
                >
                  暂无预设
                </Box>
              )}
            </Box>
          )}

          {tabValue === 0 && (
            <Box sx={{ height: "100%" }}>
              <Editor
                height="100%"
                defaultLanguage="html"
                value={template}
                onChange={(value) => onTemplateChange(value || "")}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                }}
              />
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ height: "100%" }}>
              <Editor
                height="100%"
                defaultLanguage="json"
                value={templateData}
                onChange={(value) => onTemplateDataChange(value || "")}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: "on",
                }}
              />
            </Box>
          )}

          {tabValue === 2 && (
            <Box sx={{ p: 3, overflow: "auto", height: "100%" }}>
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel>接口端点</InputLabel>
                  <Select
                    value={selectedEndpoint}
                    label="接口端点"
                    onChange={(e) => onEndpointChange(e.target.value)}
                  >
                    {endpoints.map((ep) => (
                      <MenuItem key={ep.url} value={ep.url}>
                        {ep.url}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="自定义接口地址（可选）"
                  value={customEndpoint}
                  onChange={(e) => onCustomEndpointChange(e.target.value)}
                  placeholder="https://example.com/text2img"
                  helperText="如果填写，将优先使用自定义接口"
                />

                <Box>
                  <Typography gutterBottom>
                    图片质量: {options.quality ?? 60}
                  </Typography>
                  <Slider
                    value={options.quality ?? 60}
                    min={1}
                    max={100}
                    step={1}
                    onChange={(_, value) =>
                      handleOptionsChange("quality", value)
                    }
                    marks={[
                      { value: 1, label: "1" },
                      { value: 50, label: "50" },
                      { value: 100, label: "100" },
                    ]}
                  />
                </Box>

                <Box>
                  <Typography gutterBottom>
                    超时时间（秒）: {options.timeout ?? "无限制"}
                  </Typography>
                  <Slider
                    value={options.timeout ?? 30}
                    min={5}
                    max={120}
                    step={5}
                    onChange={(_, value) =>
                      handleOptionsChange("timeout", value)
                    }
                    marks={[
                      { value: 5, label: "5s" },
                      { value: 30, label: "30s" },
                      { value: 60, label: "60s" },
                      { value: 120, label: "120s" },
                    ]}
                  />
                </Box>
                <FormControl fullWidth>
                  <InputLabel>设备像素比等级</InputLabel>
                  <Select
                    value={options.device_scale_factor_level ?? "normal"}
                    label="设备像素比等级"
                    onChange={(e) =>
                      handleOptionsChange(
                        "device_scale_factor_level",
                        e.target.value,
                      )
                    }
                  >
                    <MenuItem value="normal">Normal (1.0)</MenuItem>
                    <MenuItem value="high">High (1.3)</MenuItem>
                    <MenuItem value="ultra">Ultra (1.8)</MenuItem>
                  </Select>
                </FormControl>

                <FormControlLabel
                  control={
                    <Switch
                      checked={options.full_page ?? true}
                      onChange={(e) =>
                        handleOptionsChange("full_page", e.target.checked)
                      }
                    />
                  }
                  label="全页截图"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={options.omit_background ?? false}
                      onChange={(e) =>
                        handleOptionsChange("omit_background", e.target.checked)
                      }
                    />
                  }
                  label="透明背景（PNG）"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={options.animations === "allow"}
                      onChange={(e) =>
                        handleOptionsChange(
                          "animations",
                          e.target.checked ? "allow" : "disabled",
                        )
                      }
                    />
                  }
                  label="CSS 动画"
                />

                <Box>
                  <Stack spacing={3}>
                  <Typography gutterBottom>图片裁剪设置</Typography>

                  <TextField
                    fullWidth
                    label="裁剪横向偏移（可选）"
                    value={clip?.x ?? ""}
                    onChange={(e) =>
                      handleClipChange("x", Number(e.target.value))
                    }
                    placeholder="0"
                  />

                  <TextField
                    fullWidth
                    label="裁剪纵向偏移（可选）"
                    value={clip?.y ?? ""}
                    onChange={(e) =>
                      handleClipChange("y", Number(e.target.value))
                    }
                    placeholder="0"
                  />

                  <TextField
                    fullWidth
                    label="裁剪宽度（可选）"
                    value={clip?.width ?? ""}
                    onChange={(e) =>
                      handleClipChange("width", Number(e.target.value))
                    }
                    placeholder="0"
                  />

                  <TextField
                    fullWidth
                    label="裁剪高度（可选）"
                    value={clip?.height ?? ""}
                    onChange={(e) =>
                      handleClipChange("height", Number(e.target.value))
                    }
                    placeholder="0"
                  />
                  </Stack>
                  

                </Box>

                <Button
                  variant="outlined"
                  startIcon={<ContentCopy />}
                  onClick={handleCopyOptions}
                  fullWidth
                >
                  复制 options 参数
                </Button>
              </Stack>
            </Box>
          )}
        </Box>

        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<PlayArrow />}
            onClick={onGenerate}
            disabled={loading}
            size="large"
          >
            {loading ? "生成中..." : "渲染图片"}
          </Button>
        </Box>
      </Paper>

      <Dialog open={confirmDialog} onClose={handleCancelApply}>
        <DialogTitle>确认导入预设</DialogTitle>
        <DialogContent>
          <DialogContentText>
            当前模板编辑器中有内容，导入预设将会覆盖现有内容。确定要继续吗？
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelApply}>取消</Button>
          <Button onClick={handleConfirmApply} variant="contained" autoFocus>
            确认导入
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity="success"
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default EditorPanel;
