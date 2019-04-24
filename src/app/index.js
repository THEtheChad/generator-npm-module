import Generator from 'yeoman-generator'

export default class extends Generator {
  copy() {
    this.fs.copyTpl(
      this.templatePath(),
      this.destinationPath(),
      {},
      {},
      { globOptions: { dot: true } }
    )
  }
}