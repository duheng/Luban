const webpack = require('webpack')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const TransferWebpackPlugin = require('transfer-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const fs = require("fs")
const path = require('path')
const CWD = process.cwd()

const { entry, dllReferencePlugin, loadDllAssets, genAlias } = require('../utils/common')
const rules = require('./rules')
const plugins = (config) => {
  let __plugins = [
       new CleanWebpackPlugin({
           verbose: true,
           cleanOnceBeforeBuildPatterns: ['**/*', '!dll', '!dll/**/*']
       }),
       new webpack.DefinePlugin({
          'process.env': {
            MODE: JSON.stringify(process.env.MODE),
            NODE_ENV: JSON.stringify(process.env.NODE_ENV),
          },
          API: JSON.stringify(config.api[process.env.MODE]),
          STATIC: JSON.stringify(config.static[process.env.MODE]),
        }),
       new webpack.ProvidePlugin({
          React: 'react',
       }),
       new VueLoaderPlugin()
    ]

    if(!!config.library && Object.keys(config.library).length > 0) {
      __plugins.push(...dllReferencePlugin(config))
      __plugins.push(new AddAssetHtmlPlugin(loadDllAssets(config)))
    }
    const __assetsDir = path.join(config.base, config.assets || 'assets')
    if(fs.statSync(__assetsDir).isDirectory()) {
      __plugins.push(new TransferWebpackPlugin(
        [
          {
            from: __assetsDir,
            to: path.join(config.assets || 'assets'),
          },
        ],
        path.resolve(CWD),
      ))
    }
    return __plugins
}
const webpackConfig = config => {
  return {
    context: path.join(CWD),
    entry: entry,
    externals: config.externals || {},
    module: rules(),
    resolve: {
      modules: [
        CWD,
        path.resolve(__dirname, '..', '..', 'node_modules'),
        'node_modules',
        'bower_components',
      ],
      alias: {'vue$': 'vue/dist/vue.esm.js',...genAlias(path.join(CWD,config.base),config)},
      extensions: ['.js', '.vue', '.json', '.jsx', '.scss', '.css', '.less'],
    },
    resolveLoader: {
      modules: [path.resolve(__dirname, '..', '..', 'node_modules')],
      moduleExtensions: ['-loader'],
    },
    plugins: plugins(config)
  }
}
module.exports = webpackConfig
