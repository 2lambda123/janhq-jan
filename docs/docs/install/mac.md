---
title: Mac 
---

## Installation

### Step 1: Download the Installer
To begin using 👋Jan.ai on your Windows computer, follow these steps:

1. Visit [Jan.ai](https://jan.ai/).
2. Click on the "Download for Windows" button to download the Jan Installer.

![Jan Installer](/img/jan-download.png)

### Step 2: Download your first model
Now, let's get your first model:

1. After installation, you'll find the 👋Jan application icon on your desktop. Open it.

2. Welcome to the Jan homepage. Click on "Explore Models" to see the Model catalog.

![Explore models](/img/explore-model.png)

3. You can also see different quantized versions by clicking on "Show Available Versions."

![Model versions](/img/model-version.png)

> Note: Choose a model that matches your computer's memory and RAM.

4. Select your preferred model and click "Download."

![Downloading](/img/downloading.png)

### Step 3: Start the model
Once your model is downloaded. Go to "My Models" and then click "Start Model."

![Start model](/img/start-model.png)

### Step 4: Start the conversations
Now you're ready to start using 👋Jan.ai for conversations:

Click "Chat" and begin your first conversation by selecting "New conversation."

You can also check the CPU and Memory usage of the computer.

![Chat](/img/chat.png)

That's it! Enjoy using Large Language Models (LLMs) with 👋Jan.ai.

## Uninstallation

As Jan is development mode, you might get stuck on a broken build.

To reset your installation:

1. Delete Jan from your `/Applications` folder

2. Delete Application data:
   ```sh
   # Newer versions
   rm -rf /Users/$(whoami)/Library/Application\ Support/jan

   # Versions 0.2.0 and older
   rm -rf /Users/$(whoami)/Library/Application\ Support/jan-electron
   ```
   
3. Clear Application cache:
   ```sh
   rm -rf /Users/$(whoami)/Library/Caches/jan*
   ```

4. Use the following commands to remove any dangling backend processes:

    ```sh
    ps aux | grep nitro
    ```

    Look for processes like "nitro" and "nitro_arm_64," and kill them one by one with:

    ```sh
    kill -9 <PID>
    ```

## FAQs
