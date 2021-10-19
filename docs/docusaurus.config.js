// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Cherub',
  tagline: 'Inverse Perpetuals (3, 3) DAO',
  url: 'https://www.cherub.so',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'Cherub', // Usually your GitHub org/user name.
  projectName: 'Cherub', // Usually your repo name.

  presets: [
    [
      '@docusaurus/preset-classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl: 'https://github.com/cherub-so/cherub-protocol/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
  /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
  ({
    colorMode: {
      defaultMode: 'dark',
    },
    navbar: {
      title: 'Cherub',
      logo: {
        alt: 'Cherub Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'home',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://app.cherub.so',
          label: 'App',
          position: 'right',
        },
        {
          href: 'https://www.twitter.com/pindarosothecat',
          label: 'Twitter',
          position: 'right',
        },
        {
          href: 'https://discord.gg/5ZgcZnum',
          label: 'Discord',
          position: 'right',
        },
        {
          href: 'https://github.com/facebook/docusaurus',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Docs',
              to: '/docs/home',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/5ZgcZnum',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/pindarosothecat',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/cherub-so/cherub-protocol',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Cherub`,
    },
    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  }),
};

module.exports = config;
