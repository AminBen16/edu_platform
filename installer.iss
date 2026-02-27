#define MyAppName "Kavuma Education Platform"
#define MyAppVersion "1.0"
#define MyAppPublisher "Kavuma"
#define MyAppURL "https://kavuma.com"
#define MyAppExeName "kavuma_education_platform.exe"

[Setup]
AppId={E2E1B24B-B307-43E0-9D1F-455B2275565A}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={pf}\{#MyAppName}
DisableProgramGroupPage=yes
OutputDir=installer
OutputBaseFilename=KavumaEducationPlatform_v1.0
SetupIconFile=apps\mobile\windows\runner\resources\app_icon.ico
Compression=lzma
SolidCompression=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "apps\mobile\build\windows\x64\Release\Runner\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "packages\db\dev.db"; DestDir: "{app}\data"; Flags: ignoreversion
Source: "apps\api\*"; DestDir: "{app}\api"; Flags: ignoreversion recursesubdirs
Source: "packages\db\*"; DestDir: "{app}\db"; Flags: ignoreversion recursesubdirs
Source: "node_modules\*"; DestDir: "{app}\node_modules"; Flags: ignoreversion recursesubdirs

[Icons]
Name: "{commonprograms}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Copy database to app data directory
    FileCopy(ExpandConstant('{app}\data\dev.db'), ExpandConstant('{userappdata}\{#MyAppName}\dev.db'), false);
  end;
end;
