# manual-geotag

Allows you to batch geotag images using a map. The basic work flow is like this:
- load a bunch of images
- drag them to their positions
- copy&paste stuff to terminal

## Install / Usage

- install `exiv2` using your operating system’s package manager
- obtain tool by either of these:
  - [download zip file](https://github.com/breunigs/manual-geotag/archive/master.zip)
  - check it out using `git clone git://github.com/breunigs/manual-geotag.git`
- there’s a `index.html` file in the root directory of the project
  - open it in Firefox, Chrome or any other modern browser
- in the web page click on the file chooser to load the images
  - you can select many images at once
  - images with known positions are placed at these locations
  - images without known postions are placed in the center of the map and
    will overlap each other
- move the images to their correct position by dragging the blue markers
- once done, copy the code in the “Export” textbox
- in a terminal, navigate to the folder where the images are stored
- paste the code and the exif tags will be updated

Start a new batch by clicking the link at the bottom right.


![Screenshot of the tool in action](https://raw.github.com/breunigs/manual-geotag/master/images/screen.png)
