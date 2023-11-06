/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars are explicitly defined here.

 Create as many sidebars as you want.
 */

// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  featuresSidebar: [
    {
      type: "category",
      label: "Features",
      collapsible: true,
      collapsed: false,
      link: { type: "doc", id: "features/features" },
      items: [
        "features/ai-models",
        "features/control",
        "features/acceleration",
        "features/extensions",
      ],
    },
  ],

  guidesSidebar: [
    "guides/overview",
    {
      type: "category",
      label: "Installation",
      collapsible: true,
      collapsed: true,
      link: { type: "doc", id: "guides/install/install" },
      items: [
        "guides/install/mac",
        "guides/install/windows",
        "guides/install/linux",
        "guides/install/wsl",
        "guides/install/build-from-codebase",
        "guides/install/cloud-native",
      ],
    },
    'guides/download-model',
    "guides/start-model",
    "guides/start-conversation",
    'guides/delete-model',
    "guides/uninstallation",
    "guides/troubleshooting",
  ],

  devSidebar: [
    "developers/developers",
    "nitro/nitro",
    {
      type: "category",
      label: "Apps",
      collapsible: true,
      collapsed: true,
      items: [
        {
          type: "autogenerated",
          dirName: "developers/apps",
        },
      ],
    },
    {
      type: "category",
      label: "Plugins",
      collapsible: true,
      collapsed: true,
      items: [
        {
          type: "autogenerated",
          dirName: "developers/plugins",
        },
      ],
    },
    {
      type: "category",
      label: "API Reference",
      collapsible: true,
      collapsed: true,
      items: [
        {
          type: "autogenerated",
          dirName: "reference",
        },
      ],
    },
  ],

  aboutSidebar: [
    {
      type: "doc",
      label: "About Jan",
      id: "about/about",
    },
    {
      type: "link",
      label: "Careers",
      href: "https://janai.bamboohr.com/careers",
    },
    {
      type: "category",
      label: "Events",
      collapsible: true,
      collapsed: true,
      items: [
        "events/nvidia-llm-day-nov-23",
        {
          type: "doc",
          label: "Oct 23: HCMC Hacker House",
          id: "events/hcmc-oct23",
        },
      ],
    },
    {
      type: "category",
      label: "Company Handbook",
      collapsible: true,
      collapsed: true,
      // link: { type: "doc", id: "handbook/handbook" },
      items: [
        {
          type: "doc",
          label: "Engineering",
          id: "handbook/engineering/engineering",
        },
      ],
    },
  ],
};

module.exports = sidebars;
