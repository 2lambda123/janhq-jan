import React, { useState, useEffect } from "react";
import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import axios from "axios";

const systemsTemplate = [
  {
    name: "Download for Mac (M1/M2)",
    logo: require("@site/static/img/apple-logo-white.png").default,
    fileFormat: "{appname}-mac-arm64-{tag}.dmg",
  },
  {
    name: "Download for Mac (Intel)",
    logo: require("@site/static/img/apple-logo-white.png").default,
    fileFormat: "{appname}-mac-x64-{tag}.dmg",
  },
  {
    name: "Download for Windows",
    logo: require("@site/static/img/windows-logo-white.png").default,
    fileFormat: "{appname}-win-x64-{tag}.exe",
  },
  {
    name: "Download for Linux",
    logo: require("@site/static/img/linux-logo-white.png").default,
    fileFormat: "{appname}-linux-amd64-{tag}.deb",
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Dropdown() {
  const [systems, setSystems] = useState(systemsTemplate);
  const [defaultSystem, setDefaultSystem] = useState(systems[0]);

  const getLatestReleaseInfo = async (repoOwner, repoName) => {
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const extractAppName = (fileName) => {
    // Extract appname using a regex that matches the provided file formats
    const regex = /^(.*?)-(?:mac|win|linux)-(?:arm64|x64|amd64)-.*$/;
    const match = fileName.match(regex);
    return match ? match[1] : null;
  };

  useEffect(() => {
    const updateDownloadLinks = async () => {
      try {
        const releaseInfo = await getLatestReleaseInfo("janhq", "jan");
        
        // Extract appname from the first asset name
        const firstAssetName = releaseInfo.assets[0].name;
        const appname = extractAppName(firstAssetName);
  
        if (!appname) {
          console.error("Failed to extract appname from file name:", firstAssetName);
          return;
        }
  
        // Remove 'v' at the start of the tag_name
        const tag = releaseInfo.tag_name.startsWith("v")
          ? releaseInfo.tag_name.substring(1)
          : releaseInfo.tag_name;
  
        const updatedSystems = systems.map((system) => {
          const downloadUrl = system.fileFormat
            .replace("{appname}", appname)
            .replace("{tag}", tag);
          return {
            ...system,
            href: `https://github.com/janhq/jan/releases/download/${releaseInfo.tag_name}/${downloadUrl}`,
          };
        });
  
        setSystems(updatedSystems);
        setDefaultSystem(updatedSystems[0]);
      } catch (error) {
        console.error("Failed to update download links:", error);
      }
    };
  
    updateDownloadLinks();
  }, []);

  return (
    <div className="inline-flex align-items-stretch">
      <a
        className="cursor-pointer relative inline-flex items-center rounded-l-md border-0 px-3.5 py-2.5 text-base font-semibold text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-400 hover:text-white"
        href={defaultSystem.href}
      >
        <img
          src={require("@site/static/img/apple-logo-white.png").default}
          alt="Logo"
          className="h-5 mr-3 -mt-1"
        />
        {defaultSystem.name}
      </a>
      <Menu as="div" className="relative -ml-px block">
        <Menu.Button className="cursor-pointer relative inline-flex items-center rounded-r-md border-0 border-l border-gray-300 active:border-l active:border-white h-full text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-500 dark:hover:bg-blue-400">
          <span className="sr-only">Open OS options</span>
          <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
        </Menu.Button>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-72 text-left origin-top-right rounded-md bg-blue-600 dark:bg-blue-500 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {systems.map((system) => (
                <Menu.Item key={system.name}>
                  {({ active }) => (
                    <a
                      href={system.href}
                      className={classNames(
                        active
                          ? "bg-blue-500 dark:hover:bg-blue-400 hover:text-white"
                          : "text-white",
                        "block px-4 py-2"
                      )}
                    >
                      <img
                        src={system.logo}
                        alt="Logo"
                        className="w-3 mr-3 -mt-1"
                      />
                      {system.name}
                    </a>
                  )}
                </Menu.Item>
              ))}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
}
