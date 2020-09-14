const webpack = require("webpack");
const path = require("path");
const fs = require("fs");
const confman = require("confman");
const CWD = process.cwd();
const name = "luban";

const getConfig = () => {
  let configs = confman.load(`${CWD}/${name}`);
  return configs;
};

const getTemplate = () => {
  const __path = path.join(CWD, "template.html");
  let templ = "";
  if (fs.existsSync(__path)) {
    templ = fs.readFileSync(__path, "utf8");
  } else {
    console.log('没有在您的项目中加载到模版文件，将使用默认模版')
    templ = fs.readFileSync(
      path.join(__dirname, "..", "config", "template.html"),
      "utf8"
    );
  }
  return templ;
};

const filterFile = (dir, pattern) => {
  try {
    if (!fs.existsSync(dir)) {
      return false;
    }
  } catch (e) {
    return false;
  }
  const filenames = fs.readdirSync(dir);

  for (let i = 0; i < filenames.length; i++) {
    if (new RegExp(pattern).test(filenames[i])) {
      return filenames[i];
    }
  }
  return false;
};

const getEntry = () => {
  const __config = getConfig();
  if (typeof __config.entry != "object") {
    throw new Error(
      'entry必须object类型\n 例如："entry": {"main":"./src/pages/index.js"}\r\n'
    );
  }
  if (Object.keys(__config.entry).length > 0) {
    return __config.entry;
  } else {
    const pageDir = path.join(CWD, __config.base, __config.pages);
    try {
      if (!fs.existsSync(pageDir)) {
        console.error(`请设置项目配置文件入口entry字段`);
        return {};
      }
    } catch (e) {
      console.error(`请设置项目配置文件入口entry字段`);
      return {};
    }

    const loadPageDir = fs.readdirSync(pageDir);
    let __entry = {};
    for (let i = 0; i < loadPageDir.length; i++) { // 如果没有配置entry字段，则以pages下具体页面文件夹下index.js为入口页面，可能是多个入口页面
      const __pageDirItem = path.join(pageDir, loadPageDir[i]);
      if (fs.statSync(__pageDirItem).isDirectory()) {
        __entry[
          loadPageDir[i]
        ] = `./${__config.base}/${__config.pages}/${loadPageDir[i]}/index.js`;
      }
    }
    return __entry;
  }
};

const dllReferencePlugin = (config) => {
  const libKeys = Object.keys(config.library);
  return libKeys.map((name) => {
    const __fileName = filterFile(
      path.join(CWD, config.build, config.dll),
      `${name}[^.]*\\.manifest\\.json`
    );
    if (!__fileName) {
      console.error(`没有找到${name}对应的dll manifest.json 文件`);
      return null;
    }
    return new webpack.DllReferencePlugin({
      context: path.join(CWD),
      manifest: require(path.join(CWD, config.build, config.dll, __fileName)),
    });
  });
};

const loadDllAssets = (config) => {
  return fs
    .readdirSync(path.join(CWD, config.build, config.dll))
    .filter((filename) => filename.match(/.js$/))
    .map((filename) => {
      return {
        filepath: path.join(CWD, config.build, config.dll, filename),
        outputPath: "dll",
        publicPath: `${config.static[process.env.NODE_ENV]}/dll`,
      };
    });
};

const genAlias = (projectDir, config) => {
  const __names = fs.readdirSync(projectDir);
  const __alias = config.alias;
  let map = {};

  __names.forEach((name) => {
    map[name] = path.resolve(projectDir, name);
  });

  if (!!__alias && typeof __alias == "object") {
    Object.keys(__alias).forEach((name) => {
      map[name] = path.join(CWD,__alias[name]) 
    });
  }
  return { ...map };
};

module.exports = {
  config: getConfig(),
  entry: getEntry(),
  dllReferencePlugin,
  loadDllAssets,
  genAlias,
  getTemplate,
};
