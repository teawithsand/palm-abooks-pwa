# palm-abooks-pwa

Open source ABook player, which is PWA.

It's created using Gatsby, which is rather bad, but it works. In future it should be removed; preferably ASAP.

It was deployed at https://www.palmabooks.com and thus you may use it.

# Are PWAs reliable enough to be used to create app like that?

Well, they aren't at least as of 27.03.2023. On Android, with chrome:
- `devicemotion` events do not trigger if screen is off, which prevents sleep resetting from working properly
- Playback, once paused, can be started again for only ~30s after pausing it. Futhermore, even though it was playing last, Spotify app often takes over.

# License
Whole codebase is GNU AFFERO GENERAL PUBLIC LICENSE Version 3 licensed.