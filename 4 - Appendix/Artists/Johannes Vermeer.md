#Artist

# Johannes Vermeer

## Key Works

```dataview
TABLE
    date_display AS Date,
    medium AS Medium,
    institution AS Institution
FROM "4 - Appendix/Artworks"
WHERE artist = this.file.link
AND key_work = true
SORT date_start ASC
```


## All Works
```dataview
TABLE
    date_display AS Date,
    medium AS Medium,
    institution AS Institution
FROM "4 - Appendix/Artworks"
WHERE artist = this.file.link
SORT date_start ASC
```
