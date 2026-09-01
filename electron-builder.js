import { build } from "electron-builder";

const config = {
  appId: "com.nexo.windows",
  productName: "Nexo",
  directories: {
    output: "dist-electron",
  },
  files: ["dist/**/*", "electron/**/*", "package.json"],
  win: {
    target: [
      {
        target: "NSIS",
        arch: ["x64"],
      },
    ],
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    perMachine: true,
  },
  publish: {
    provider: "github",
  },
};

build({ config }).catch((error) => {
  console.error("Build failed:", error);
  process.exit(1);
});