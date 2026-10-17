// The one shared config (repo root config/screening.json), bundled via metro.config.js watchFolders.
import screening from '../../config/screening.json';

import type { Config } from '@/rules';

export const cfg: Config = screening;
export const CONFIG_VERSION: string = screening.config_version;
