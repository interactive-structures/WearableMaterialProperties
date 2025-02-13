const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    bundle: path.resolve(__dirname, 'src/index.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true, // 清理 /dist 文件夹
  },
  devtool: 'source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    port: 3000,
    // open: true, // 自动打开浏览器, but throw error
    hot: true, // 开启热更新
    compress: true, // 开启gzip压缩
    historyApiFallback: true, // 任意的 404 响应都可能需要被替代为 index.html
  },
  module:{
    rules:[
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  },
  plugins:[
    new HtmlWebpackPlugin({
      title: 'Wearable Material Properties',
      filename: "index.html",
      template: path.resolve(__dirname, 'src/index.html')
    })
  ],
}