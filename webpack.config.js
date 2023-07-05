const path = require('path');
const fs = require('fs')
const HTMLWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const OptimizeCssAssetWebpackPlugin = require('optimize-css-assets-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack');
const glob_entries = require('webpack-glob-entries')
const isDev = process.env.NODE_ENV === 'development';
const isProd = !isDev;

const filename = (ext) => isDev ? `[name].${ext}` : `[name].[contenthash].${ext}`;



const PAGES_DIR = `${path.join(__dirname, './src')}/template/pages`
const PAGES = fs.readdirSync(PAGES_DIR).filter(fileName => fileName.endsWith('.njk'))

const optimization = () => {
  const configObj = {
    splitChunks: {
      chunks: 'all'
    }
  };

  if (isProd) {
    configObj.minimizer = [
      new OptimizeCssAssetWebpackPlugin(),
      new TerserWebpackPlugin()
    ];
  }

  return configObj;
};
const HtmlWebpackPluginConfig = new HTMLWebpackPlugin({
    filename: 'index.html',
    inject: 'body',

    // Here is part of the magic, we get the index.njk but we tell
    // webpack to pass it through the nunjucks-html-loader
    template: 'nunjucks-html-loader!./src/template/index.njk',
});

function returnEntries(globPath){
  let entries = glob_entries(globPath, true);
  let folderList = new Array();
  for (let folder in entries){
     folderList.push(path.join(__dirname, entries[folder]));
  }
  return folderList;
}
const plugins = () => {
  const basePlugins = [
    // new HTMLWebpackPlugin({
    //   // template: path.resolve(__dirname, 'src/template/pages/index.html'),
    //   ...PAGES.map(page => new HTMLWebpackPlugin({
    //     template: `${PAGES_DIR}/${page}`,
    //     filename: `./${page.replace(/\.html/,'.html')}`
    //   })),
    //   // filename: 'index.html',
    //   minify: {
    //     collapseWhitespace: isProd
    //   }
    // }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: `./css/${filename('css')}`
    }),
    new CopyWebpackPlugin({
      patterns: [
        {from: path.resolve(__dirname, 'src/assets') , to: path.resolve(__dirname, 'app/assets')}
      ]
    }),

    ...PAGES.map(page => new HTMLWebpackPlugin({
      template: `${PAGES_DIR}/${page}`,
      filename: `./${page.replace(/\.njk/,'.html')}`,
      minify: {
        collapseWhitespace: isProd
      }
    }))
  ];

  if (isProd) {
    basePlugins.push(
      new ImageminPlugin({
        bail: false, // Ignore errors on corrupted images
        cache: true,
        imageminOptions: {
          plugins: [
            ["gifsicle", { interlaced: true }],
            ["jpegtran", { progressive: true }],
            ["optipng", { optimizationLevel: 5 }],
            [
              "svgo",
              {
                plugins: [
                  {
                    removeViewBox: false
                  }
                ]
              }
            ]
          ]
        }
      })
    )
  }

  return basePlugins;
};

module.exports = {
  context: path.resolve(__dirname, 'src'),
  mode: 'development',
  entry: './js/main.js',
  output: {
    filename: `./js/${filename('js')}`,
    path: path.resolve(__dirname, 'app'),
    publicPath: ''
  },
  devServer: {
    historyApiFallback: true,
    contentBase: path.resolve(__dirname, 'app'),
    // open: true,
    // hot: true,
    compress: true,
    port: 3000,
    writeToDisk: true,
  },
  optimization: optimization(),
  plugins: plugins(),
  devtool: isProd ? false : 'source-map',
  module: {
    rules: [
      {
        test: /\.html$|njk|nunjucks/,
        use: ['html-loader',{
          loader: 'nunjucks-html-loader',
          options : {
            searchPaths: [...returnEntries('./src/template/**/')]
          }
        }]
      },
      // {
      //   test: /\.html$/,
      //   loader: 'html-loader',
      //   options: {
      //     // pretty: true,
      //   }
      // },
      {
        test: /\.css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              hmr: isDev
            },
          },
          'css-loader'
        ],
      },
      {
        test: /\.s[ac]ss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: (resourcePath, context) => {
                return path.relative(path.dirname(resourcePath), context) + '/';
              },
            }
          },
          'css-loader',
          'sass-loader'
        ],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.(?:|gif|png|jpg|jpeg|svg)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `./img/${filename('[ext]')}`
          }
        }],
      },
      {
        test: /\.(?:|woff2|woff|ttf|eot)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: `./fonts/${filename('[ext]')}`
          }
        }],
      }
    ]
  }
};
