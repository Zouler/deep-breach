Deep Breach — optional branding drops (not required to run)

Place files here when you have art ready, then wire them in code / app.json:

- logo.png        — title / start screen (update constants/brandingAssets.ts require path)
- splash.png      — full-bleed splash (reference from app.json "splash.image")
- background.png  — optional full-screen texture (load via ImageBackground once file exists)

The app ships with safe fallbacks using existing Expo template images under assets/images/.
