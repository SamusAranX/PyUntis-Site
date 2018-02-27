# PyUntis-Site
PyUntis-Site (amazing name, I know) is an interface for [`PyUntis`](https://github.com/SamusAranX/PyUntis), which creates its data.

## Screenshots
![PyUntis-Site in Safari on macOS](https://user-images.githubusercontent.com/676069/36731888-66bb8f04-1bcc-11e8-87ad-98fefd01645b.png)

![PyUntis-Site on iOS](https://user-images.githubusercontent.com/676069/36731889-66d57040-1bcc-11e8-876b-ed016274d085.png)

## Features
* __Extremely small:__ If you have GZIP compression enabled on your server, a full page load is just about 30 kilobytes, most of which gets cached by the browser after the first load.
* __Extremely fast:__ All site transitions are done with JS and CSS so the site never has to reload.
* __Responsive:__ The page is usable on all modern devices and dynamically resizes to fit each one.
* __Clean design:__ I mean, have you _seen_ the Untis app?
* …and also:
	* The site remembers which class's timetable you were looking at last time and highlights it in the menu to help you find it
	* You can link directly to a class's timetable link and it will Just Work™
	* Not that anyone does that still, but you can drop a bookmark on your iOS homescreen and the site will behave like a webapp

## Requirements

* A web server 
	* If you're using Apache and you want to hide the Git files, the `RedirectMatch` directive has to be available for the .htaccess file

## Usage

Just clone this repository somewhere into your web server's directory.

Open `core.js` and change the contents of the `config` variable:

```
var config = {
	schoolName: "My School",
	plansDir: "plans/",
	showSubstitutions: false,
	debug: false
};
```

* You'll probably only have to change `schoolName`. This will be displayed in the menu header.
* `plansDir` has to match the PyUntis config's `plansDir` value.
* If you know with certainty that your school allows API access to substitution data, switch `showSubstitutions` to `true`.
* `debug` currently just adds a new entry labeled "error" to the class selection menu. Nothing too fancy.

## Installing Updates

Because the configuration currently involves modifying `core.js`, you'll have to stash your changes before pulling updates from the repo.

For me, updating the site goes like this:

```
git stash
git pull
git stash pop
```

## Known Issues

* Teacher names/abbreviations are currently not displayed
* The site looks weird in older browsers
	* It looks fine in Firefox, Safari, and Chrome. Just use those.
* The fonts in the screenshots look different
	* On my sites (and in the Screenshots), I use Eve Sans Neue, a font from the game EVE Online. I'm pretty sure it's not allowed to redistribute these, so they're not included in this repo. The site will fall back to the viewers' system fonts, where supported.

## Feedback and Support
Just tweet at me [@SamusAranX](https://twitter.com/SamusAranX) or [drop me a mail](mailto:hallo@peterwunder.de).
Feel free to create an issue if you encounter any crashes, bugs, etc.: [PyUntis-Site Issues](https://github.com/SamusAranX/PyUntis-Site/issues)