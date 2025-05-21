const path = require("path");

module.exports = {
  target: "node",
  mode: "development",
  entry: "./src/extension.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded.
  },
  devtool: "source-map",
};
