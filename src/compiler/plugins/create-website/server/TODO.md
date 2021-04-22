# Todo

- Find broken links wget --spider -r -nd -nv -o run1.log black:3000 clear; grep -B1 'broken link!' run1.log utility to warn about missing resources monitor audio images, internal links, 404, etc.
- add a book of favorite quotes on top of images just call it quotes, these are printer friendly


## Done
- restore empty poems with folder poetry  (red red rose, if, invictus, etc) https://github.com/westland-valhalla/poems/tree/master/dist/poems-txt right now poems start with poetry-0016 so there are 16 empty slots in the beginning
- fetch the updated dates with gist https://gist.github.com/catpea/0f2de6ed7008a97da6ecbe0b3559cb88
- warrior origin needs to be responsible for creating images of content, that may mean YAML parsing.
- Feeds need to have paths fixed, replace src=\"image/ with src=\"/image/
- Create images for warrior book wget -nd -p -P xxx -A jpg http://black:3000/read/westland-warrior/72 ; ll xxx; montage xxx/*.jpg test.jpg
- Copy files and images cp /home/meow/Universe/Development/poetry/docs/image/* static/image/ cp /home/meow/Universe/Development/poetry/docs/audio/* static/audio/ cp /home/meow/Universe/Development/warrior/docs/images/* static/image/
