check it out: [something-lovat.vercel.app](https://something-lovat.vercel.app/)

what do you think about this Skyler... we just go back and forth and add new stuff to the game. no discussion, you just do whatever you want with it now and when you're done, i'll pick up the baton. then if we want to keep going or build something else, we can.


**...ok cool, but how do i run this thing on my own machine?**

1. install vs code
2. [install node.js](https://www.youtube.com/watch?v=YbwagbZef5w)
3. download [the code](https://github.com/jonstoked/something)
4. open the folder you downloaded in vs code
5. [open the terminal in vs code](https://www.youtube.com/watch?v=eZAT6fwMVgY)
6. install the project by typing `npm install`
7. run the project by typing `npm run dev`
8. in the terminal you'll see the url where the game is running, usually something like http://localhost:5173/ — go there to play the game

every time you save a file, the browser will automatically reload with your changes. you don't need to restart anything.


**ok cool yeah i get it, but where do i actually write code?**

the interesting files are all in `src/scenes/`:

- `IntroScene.ts` — the opening text crawl and "let's go" button
- `GameScene.ts` — the actual game: the worm, the ball, physics, drawing
- `StarField.ts` — the twinkling stars that show up in both scenes
- `BootScene.ts` — loads the music and kicks everything off

typescript is just javascript with types. if you've written js before, most of it will read fine. if something looks weird, just google "typescript [the thing that looks weird]".

**ok cool yeah i get it, but how do i add my own code?**

1. [create a github account](https://github.com/signup)
2. email me your github user name and i'll add you as a collaborator on the project
3. [install git](https://www.youtube.com/watch?v=t2-l3WvWvqg)
4. [learn how to *commit* and *push* in git](https://www.youtube.com/watch?v=z5jZ9lrSpqk)

take as long as you want. four hours, four weeks, whatever.

i built this with phaser — it handles all the game stuff: physics, drawing, input. learn more at https://docs.phaser.io/

i've called the project "something" for now... it needs a name

reach out any time with questions
