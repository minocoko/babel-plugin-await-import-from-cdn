import { execSync } from 'child_process';

export default (packageManager) => ({
  list: () => {
    const result = execSync(`${packageManager} list --depth=0`, { encoding: 'utf-8' });
    const lines = result.replace(/├─ /g, '').trim().split('\n');
    return lines
      .map((line) => {
        const parts = line.split('@');
        const version = parts[parts.length - 1];
        const name = parts.length === 2 ? parts[0] : parts[0] + parts[1];
        return [name, version];
      })
      .reduce((obj, [name, version]) => {
        const newObj = { ...obj };
        newObj[name] = version;
        return newObj;
      }, {});
  },
});
