// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Cherub',
  tagline: 'Inverse Perpetuals DAO (3, 3)',
  url: 'https://www.cherub.markets',
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
          editUrl: 'https://github.com/cherub-protocol/cherub-protocol/',
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
        src: 'img/logo-dark.png',
      },

      items: [
        {
          type: 'doc',
          docId: 'about/introduction',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.cherub.markets',
          label: 'Marketing',
          position: 'right',
        },
        {
          href: 'https://app.cherub.markets',
          label: 'App',
          position: 'right',
        },
        {
          href: 'https://www.twitter.com/cherubprotocol',
          label: 'Twitter',
          position: 'right',
        },
        {
          href: 'https://discord.gg/VnhKZdA4',
          label: 'Discord',
          position: 'right',
        },
        {
          href: 'https://github.com/cherub-protocol/cherub-protocol',
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
              to: '/docs/about/introduction',
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
              href: 'https://twitter.com/cherubprotocol',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/cherub-protocol/cherub-protocol',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Cherub`,
    },

    algolia: {
      appId: 'S65W0J24VG',
      apiKey: '6f21b6197bfec52599a66eb0ad1fe755',
      indexName: 'docs',
      contextualSearch: true,
      externalUrlRegex: 'dev\\.cherub\\.markets',
    },

    prism: {
      theme: lightCodeTheme,
      darkTheme: darkCodeTheme,
    },
  }),
};

module.exports = config;
