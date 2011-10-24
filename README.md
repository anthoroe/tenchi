# Tenchi

This is v4 (forth rewrite) of my [wakusei](https://github.com/boj/wakusei) (v3) / [chikyu](https://github.com/boj/chikyu) (v2) / [yume](https://github.com/boj/yume) (v1) node.js project.

This iteration introduced the following:

* Split everything out into component servers built on [hook.io](http://hook.io) (web, login, game).
* Closer to true realtime networking over socket.io, and a high speed game loop.

As usual many lessons were learned this time around, but while working on a new feature branch I reached a higher plateau and new designs are required.  [ZeroMQ](http://www.zeromq.org) has opened my mind quite a bit, and oddly enough [Unity3d](http://unity3d.com).

It seems kind of silly to create new projects each time I "take things to the next level" especially considering it's so easy to branch/refactor/merge using git, but I see each iteration as a new step on my path towards enlightenment so I will continue in this manner.

# Requirements

    npm install mersenne express socket.io jade hook.io
    npm install hook.io-repl -g
