const tsConfigPaths = require("tsconfig-paths");
tsConfigPaths.register({
  baseUrl: "./",
  paths: {
    // "orm": ["./orm-decorator/index"],
    // "orm/*": ["./orm-decorator/*"],
    "@orm": [
      process.env.LUBEJS_TEST_KIND === "decorator"
        ? "./orm-decorator/index"
        : "./orm-configure",
    ],
    // "@orm/*": [
    //   process.env.LUBEJS_TEST_KIND === "decorator"
    //     ? "./orm-decorator/*"
    //     : "./orm-configure/*",
    // ],
    "@lubejs-driver": [
      `./node_modules/lubejs-${process.env.LUBEJS_TEST_DRIVER}`,
    ],
    "@lubejs-driver/*": [
      `./node_modules/lubejs-${process.env.LUBEJS_TEST_DRIVER}/*`,
    ],
  },
});
