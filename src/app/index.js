import util from 'util'
import path from 'path'
import { exec as execRaw } from 'child_process'
import Generator from 'yeoman-generator'
const exec = util.promisify(execRaw)

let packageJSON = {
  version: '1.0.0',
  main: 'lib/main.js',
  license: 'MIT',
  scripts: {
    'clean': 'shx rm -rf lib',
    'build': 'gosub clean && babel src --include-dotfiles --copy-files --out-dir lib',
    "build:watch": "gosub build -- -w",
    'start': 'gosub build && node $npm_package_main',
    'test': 'gosub build && jasmine',
    "prepare": "gosub build"
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
    '@babel/plugin-proposal-class-properties'
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
  constructor(args, opts) {
    super(args, opts)

    this.argument('appname', { type: String, required: true })
  }

  setName = (name) => {
    this.log(`generating project ${name}...`)
    packageJSON = Object.assign({name}, packageJSON)
    this.destinationRoot(path.join(this.destinationRoot(), name))
  }

  async prompting() {
    if(!this.options.appname){
      const answers = await this.prompt([
        {
          type: 'input',
          name: 'appname',
          message: 'Project name'
        }
      ])

      this.options.appname = answers.appname
    }

    this.setName(this.options.appname)
  }

  async getLatest(){
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