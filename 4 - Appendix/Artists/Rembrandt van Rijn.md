#Artist



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
