# palm-abooks-pwa

Open source ABook player, which is PWA. See https://www.palmabooks.com 

It's created using Gatsby, which is rather bad, but it works. In future it should be removed; preferably ASAP.

It was deployed at https://www.palmabooks.com and thus you may use it.

# Are PWAs reliable enough to be used to create app like that?

Well, they aren't at least as of 27.03.2023. On Android, with chrome:
- `devicemotion` events do not trigger if screen is off, which prevents sleep resetting from working properly
- Playback, once paused, can be started again for only ~30s after pausing it. Futhermore, even though it was playing last, Spotify app often takes over.
- Dealing with cross browser differences is hard and tedious task. Dealing with these differences with apis like media playback, service workers and stuff makes that double as hard or triple taking into consideration that main target of this app are mobile devices. 
- Android really loves killing PWAs, which play audio even though they display media session notifications and play stuff. Please note that it was never a problem with Android Firefox not pwa media playing pages. Only chrome displayed that behavior.

# License
Whole codebase is GNU AFFERO GENERAL PUBLIC LICENSE Version 3 licensed.