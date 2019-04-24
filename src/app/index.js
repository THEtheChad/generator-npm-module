import Generator from 'yeoman-generator'
import util from 'util'
import { exec as execRaw } from 'child_process'
const exec = util.promisify(execRaw)

const packageJSON = {
  main: 'lib/main.js',
  license: 'MIT',
  version: '1.0.0',
  scripts: {
    'clean': 'shx rm -rf lib',
    'build': 'gosub clean && babel src --include-dotfiles --copy-files --out-dir lib',
    'start': 'gosub build && VERSION=$npm_package_version node $npm_package_main',
    'test': 'gosub build && jasmine'
  },
  dependencies: [
    'debug'
  ],
  devDependencies: [
    'shx',
    'gosub',
    '@babel/cli',
    '@babel/core',
    '@babel/preset-env',
  ]
}

async function getLatest(list){
  const results = list.map(name => exec(`npm show ${name} name version --json`))
  list = await Promise.all(results)

  return list.reduce((memo, result) => {
    const dep = JSON.parse(result.stdout)
    memo[dep.name] = `^${dep.version}`
    return memo
  }, {})
}

export default class extends Generator {
  async latest(){
    const [dependencies, devDependencies] = await Promise.all([
      getLatest(packageJSON.dependencies),
      getLatest(packageJSON.devDependencies),
    ])
    packageJSON.dependencies = dependencies
    packageJSON.devDependencies = devDependencies
  }

  copy() {
    this.fs.copyTpl(
      this.templatePath(),
      this.destinationPath(),
      {},
      {},
      { globOptions: { dot: true } },
    )

    this.fs.write(
      this.destinationPath('package.json'),
      JSON.stringify(packageJSON, null, 2),
    )
  }
}