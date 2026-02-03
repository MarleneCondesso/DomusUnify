USE master;
ALTER DATABASE DomusUnifyDb SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
DROP DATABASE DomusUnifyDb;



use DomusUnifyDb


SELECT Id, FamilyId, Name, IconKey
FROM ItemCategories
WHERE Id = 'a4e6dc05-901b-40a6-95b1-c9cbd6069aaa';

SELECT * FROM ListItems
WHERE CategoryId = 'a4e6dc05-901b-40a6-95b1-c9cbd6069aaa';

