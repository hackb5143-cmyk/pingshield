const root='E:/ANTIGRAVITY WEBSITE/venturex-deck';
const {finalizePresentation}=await import('file:///C:/Users/hp/.codex/plugins/cache/openai-primary-runtime/presentations/26.1112.11217/skills/presentations/container_tools/artifact_tool_utils.mjs');
const skill='C:/Users/hp/.codex/plugins/cache/openai-primary-runtime/presentations/26.1112.11217/skills/presentations';
const result=await finalizePresentation({workspaceDir:root,candidatePath:root+'/build/candidate.pptx',finalPath:root+'/output/PingShield_PEAKY_BLINDERS_VENTUREX.pptx',pythonExecutable:'C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1112-737-0_26.1112.737.0_x64__3k8sg7r9htsxt/dependencies/python/python.exe',integrityValidatorPath:skill+'/container_tools/inspect_presentation_package_integrity.py',layoutValidatorPath:skill+'/container_tools/inspect_presentation_layout_geometry.py',layoutArgs:['--expected-slide-size-emu','18288000,10287000','--validate-heading-fit'],explicitTotalSlideCount:6,verifyArtifactToolImport:true,receiptPath:root+'/build/validation.json'});console.log(result);


