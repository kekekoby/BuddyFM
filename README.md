A Last.fm tool that helps you scrobble with friends!
---
### Given a start and end time, scrobble all the tracks your friend did!
- Say you were with a friend from 1PM - 5PM, input the start and end time and then all their scrobbles from that time period will go to your account! Alongside the correct timestamp.

### Real time co-scrobbling!
- If you're listening with a friend, have whatever they're currently listening to scrobble on your own account! This will last for as long as the website is open on a tab.
---
### TODO
- [ ] Logout
- [ ] Limit real time sync to only one connection at a time
- [ ] Limit scrobble transfer to 24-hour periods
- [ ] Edit db to end real time sync sessions once tab is closed or etc
- [ ] Proper error handling... 
- [ ] Add CSS lol and general design
- [ ] POSSIBLE BUG: (Real time sync) if someone is looping a track, it'll only be scrobbled once (currently checks if a track.artist and track.name has changed to consider it as a new scrobble)

### DONE:
- [X] Authentication
- [X] Get scrobbles
- [X] Transfer scrobbles
- [X] Real time sync
- [X] Basic HTML
- [X] Add 'Scrobbling now' to receiving user during real time sync
- [X] Check for duplicated scrobblings, i.e., someones just spamming the scrobble transfer feature
