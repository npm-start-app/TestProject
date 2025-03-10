import { readFile } from 'fs/promises';

class Config {
    static config = {};

    static async ini() {
        this.config = JSON.parse(
            await readFile(
                new URL('./config.json', import.meta.url)
            )
        );
    }

    static get() {
        return this.config;
    }
}

await Config.ini()

export default Config