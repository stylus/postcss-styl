# postcss-styl

[![NPM license]](https://www.npmjs.com/package/postcss-styl)
[![NPM version]](https://www.npmjs.com/package/postcss-styl)
[![NPM downloads]](https://www.npmjs.com/package/postcss-styl)
[![Build Status]](https://github.com/stylus/postcss-styl/actions?query=workflow%3ACI)
[![Coverage Status]](https://coveralls.io/github/stylus/postcss-styl?branch=main)

[PostCSS] parser plugin for converting [Stylus] syntax to [PostCSS] AST.

:::
**_This plugin is still in an experimental state_**
:::

## Installation

```bash
npm install -D postcss-styl
```

## Usage

### Lint Stylus with [stylelint]

You can use this [PostCSS] plugin to apply [Stylus] syntax to [stylelint].  
**You can use it more easily by using it with [stylelint-stylus](https://github.com/stylus/stylelint-stylus).**

For example, this [PostCSS] plugin is used as follows:

1. First, add `customSyntax` option to `stylelint` config file.

   e.g. [stylelint.config.js](./stylelint.config.js)

   ```js
   // Filename: `stylelint.config.js`

   module.exports = {
      overrides: [
          {
              files: ["*.styl", "**/*.styl", "*.stylus", "**/*.stylus"],
              customSyntax: "postcss-styl",
          },
      ],
   };
   ```

2. You need to include the stylus in the linting target, as shown in the following example.

   - via CLI

     ```bash
     stylelint ./path/to/input.styl
     ```

   - with [VSCode extension]

     ```js
     {
       "stylelint.validate": [
          ...,
          // ↓ Add "stylus" language.
          "stylus"
       ]
     }
     ```

### Stylus Transformations

Also you can use this parser plugin to apply [PostCSS] transformations directly to the [Stylus] source code.

For example, [Stylus] sources can be automatically prefixed using [Autoprefixer].

```js
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const postcssStyl = require("postcss-styl");

const stylusCode = `
a
  transform scale(0.5)
`;
postcss([autoprefixer])
  .process(stylusCode, {
    syntax: postcssStyl
  })
  .then(result => {
    console.log(result.css);
    // ->
    // a
    //   -webkit-transform scale(0.5);
    //   -moz-transform scale(0.5);
    //   transform scale(0.5)
  });
```

## Contributing

Welcome contributing!

Please use GitHub's Issues/PRs.

### Development Tools

- `npm test` runs tests and measures coverage.

### AST

You can check the AST online.  
https://stylus.github.io/postcss-styl/

## License

See the [LICENSE] file for license rights and limitations (MIT).

[postcss]: https://postcss.org/
[VSCode extension]: https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint
[stylus]: http://stylus-lang.com/
[stylelint]: http://stylelint.io/
[autoprefixer]: https://github.com/postcss/autoprefixer
[postcss-syntax]: https://github.com/gucong3000/postcss-syntax
[license]: ./LICENSE
[npm license]: https://img.shields.io/npm/l/postcss-styl.svg
[npm version]: https://img.shields.io/npm/v/postcss-styl.svg
[npm downloads]: https://img.shields.io/npm/dw/postcss-styl.svg
[Build Status]: https://github.com/stylus/postcss-styl/workflows/CI/badge.svg?branch=main
[Coverage Status]: https://coveralls.io/repos/github/stylus/postcss-styl/badge.svg?branch=main
