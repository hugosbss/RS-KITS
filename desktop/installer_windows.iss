; =============================================================================
; Instalador Windows do RS KITS (Inno Setup 6).
;
; Produz: release\windows\RS-KITS-Setup-<versao>.exe
;
; Experiência profissional:
;   · Instala RS-KITS.exe em {autopf}\RS KITS;
;   · Opções selecionáveis (todas marcadas por padrão):
;       ☑ Área de Trabalho\RS KITS.lnk
;       ☑ Menu Iniciar\RS KITS.lnk
;       ☑ Executar o RS KITS ao concluir
;   · Entrada normal em Configurações → Aplicativos → Aplicativos instalados
;     (desinstalação padrão do Windows);
;   · Desinstalar/atualizar NUNCA apaga os dados do usuário em
;     %APPDATA%\RS-KITS\ (database, packages, logs, config). A remoção desses
;     dados é sempre uma ação separada e explícita feita pelo usuário;
;   · Atualização: substitui só os arquivos da aplicação; atalhos continuam
;     válidos (apontam para o mesmo caminho) e os dados ficam intactos;
;   · Nunca abre navegador externo (a janela é PyWebView nativa).
;
; Se MicrosoftEdgeWebview2Setup.exe (WebView2 Runtime Evergreen) estiver em
; prereqs\, ele é embutido e instalado silenciosamente caso o runtime não
; esteja presente no sistema.
; =============================================================================
#ifndef AppVersion
  #define AppVersion "1.0.0"
#endif

#define MyAppName "RS KITS"
#define MyAppExeName "RS-KITS.exe"
#define MyAppDataDir "{userappdata}\RS-KITS"

[Setup]
AppId={{35548270-A5FB-4E9C-B1D0-9C6E7DD3F5D1}
AppName={#MyAppName}
AppVersion={#AppVersion}
AppPublisher=RS KITS
AppVerName={#MyAppName} {#AppVersion}
VersionInfoVersion={#AppVersion}.0
DefaultDirName={autopf}\RS KITS
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=release\windows
OutputBaseFilename=RS-KITS-Setup-{#AppVersion}
Compression=lzma2/max
SolidCompression=yes
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
SetupIconFile=build\assets\icon.ico
UninstallDisplayIcon={app}\icon.ico
UninstallDisplayName={#MyAppName}
CloseApplications=yes
CloseApplicationsFilter={#MyAppExeName}
SetupLogging=yes
WizardStyle=modern

[Languages]
Name: "pt_BR"; MessagesFile: "compiler:Languages\Portuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "Criar atalho na &área de trabalho"; GroupDescription: "Atalhos:"
Name: "startmenuicon"; Description: "Criar atalho no &Menu Iniciar"; GroupDescription: "Atalhos:"
;
; "Executar o RS KITS" aparece como opção na última página do instalador.
; Todas as opções ficam marcadas por padrão (Inno) e podem ser desmarcadas.
;
Name: "launchapp"; Description: "&Executar o RS KITS"; GroupDescription: "Finalização:"

[Files]
Source: "dist\RS-KITS.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "build\assets\icon.ico"; DestDir: "{app}"; Flags: ignoreversion
#ifexist "prereqs\MicrosoftEdgeWebview2Setup.exe"
Source: "prereqs\MicrosoftEdgeWebview2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall; Check: NotWebView2Installed
#endif
;
; NOTA: os dados ficam em %APPDATA%\RS-KITS\ e NÃO aparecem aqui de propósito.
; Inno só toca em {app} — desinstalar ou atualizar jamais remove database/,
; packages/, logs/ nem config/ do usuário.

[Icons]
Name: "{autoprograms}\{#MyAppName}.lnk"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"; Tasks: startmenuicon
Name: "{autoprograms}\Desinstalar o {#MyAppName}.lnk"; Filename: "{uninstallexe}"; Tasks: startmenuicon
Name: "{autodesktop}\{#MyAppName}.lnk"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\icon.ico"; Tasks: desktopicon

[Run]
#ifexist "prereqs\MicrosoftEdgeWebview2Setup.exe"
Filename: "{tmp}\MicrosoftEdgeWebview2Setup.exe"; Parameters: "/silent /install"; Flags: waituntilterminated; StatusMsg: "Preparando o runtime da janela (WebView2)..."; Check: NotWebView2Installed
#endif
Filename: "{app}\{#MyAppExeName}"; Description: "Executar o {#MyAppName}"; Flags: nowait postinstall skipifsilent; Tasks: launchapp

[Code]
function NotWebView2Installed(): Boolean;
var
  value: string;
begin
  if RegKeyExists(HKLM, 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}') then
    begin
      Result := False;
      exit;
    end;
  if RegKeyExists(HKLM, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}') then
    begin
      Result := False;
      exit;
    end;
  if RegQueryStringValue(HKCU, 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}', 'pv', value) and (value <> '') then
    begin
      Result := False;
      exit;
    end;
  Result := True;
end;