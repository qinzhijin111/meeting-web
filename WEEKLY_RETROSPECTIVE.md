
# Week 1 Retrospective

## What I Learned

This week, I became familiar with the basic development workflow and the core technologies used in the project.

On the Git side, I learned the basic workflow of cloning a repository, creating branches, making commits, pushing changes, and opening a pull request. This also helped me better understand how Git and GitHub are used for collaboration rather than just version control.

For Next.js, I learned the fundamentals of the App Router and became more familiar with pages, layouts, Client Components, Server Components, and environment variables. Building the initial application helped me understand how these concepts fit together in a real project.

I also learned the basic concepts behind LiveKit, including rooms, participants, tracks, publishing, subscribing, tokens, and the server URL. By connecting two browser sessions to the same room, I was able to see how multiple participants communicate in real time.

Finally, testing microphone and camera permissions helped me better understand that browser permissions are an important part of WebRTC applications. I also learned how permission denial affects the user experience and how the application should handle these cases.

## What Was Confusing

One of the more challenging parts this week was understanding how the different LiveKit concepts connect together. At first, terms such as room, participant, track, publish, and subscribe were individually understandable, but it was less clear how they interact during an actual realtime session.

The token-generation flow was also initially confusing. I needed to understand why the token should be generated on the server side, what information it contains, and how the frontend uses the token together with the LiveKit server URL to connect to a room.

Another area that required some adjustment was understanding the boundary between Next.js Client Components and Server Components, especially when browser-only APIs such as microphone and camera access are involved.

Testing with two browser sessions also made me think more carefully about participant identity and how multiple clients behave inside the same room.

## What I Will Change Next Week

Next week, I want to focus more on understanding the architecture behind the features I build instead of only getting them to work.

Before implementing a feature, I will spend more time breaking down the data flow and identifying which parts should run on the client, which should run on the server, and how they communicate with LiveKit.

I also want to test edge cases earlier during development, especially browser permission failures, connection errors, and different participant states, rather than testing them only after the main functionality is complete.

Finally, I will keep my commits smaller and more focused and document important technical decisions as I work. This should make my pull requests easier to review and help me identify problems earlier.
