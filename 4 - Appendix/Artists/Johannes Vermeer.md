#Artist

# Johannes Vermeer

## Key Works

```dataview
TABLE date, medium, institution
FROM "4 - Appendix/Artworks"
WHERE artist = this.file.link
AND key_work = true
SORT date ASC
```
## All Works

```dataview
TABLE date, period, medium, institution
FROM "4 - Appendix/Artworks"
WHERE artist = this.file.link
SORT date ASC
```
