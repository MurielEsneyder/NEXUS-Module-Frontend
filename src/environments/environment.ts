// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  name: "local",
  origin: "HyL-Sparta-V2",
  production: true,

  auth: 'https://nerd-commodore-claim.ngrok-free.dev/auth/login',
  services: 'https://nerd-commodore-claim.ngrok-free.dev/api',
  menu: 'https://nerd-commodore-claim.ngrok-free.dev/api/menu/ejecutarMenus'
};
