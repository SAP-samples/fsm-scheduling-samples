require('dotenv').config();


export class ConfigService {

  constructor(private env: { [k: string]: string | undefined }) { }

  private getValue(key: string, throwOnMissing = true): string {
    const value = this.env[key];
    if (!value && throwOnMissing) {
      throw new Error(`config error - missing env.${key}`);
    }

    if (!value) {
      console.log(`INFO -> ENV var ${key} does not have a value`);
    }

    return value;
  }

  public getPort() {
    return this.getValue('PORT', false) || 8000;
  }

  public isProduction() {
    const mode = this.getValue('MODE', false);
    return mode === 'production';
  }

  public isLocal() {
    const mode = this.getValue('MODE', false);
    return mode === 'local';
  }

  public getOptimisationAPIHost() {
    return this.getValue('OVERWRITE_OPTIMISATION_HOST', false) || undefined
  }

}

const configService = new ConfigService(process.env);

export { configService };