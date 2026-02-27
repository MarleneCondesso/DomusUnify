-- Ficar sem familia ativa
BEGIN TRAN;

DECLARE @FamilyId uniqueidentifier = '0754eda3-cb11-4bac-a015-6510566dad0b';

-- ver quem está a apontar para esta família
SELECT Id, Email, CurrentFamilyId
FROM dbo.Users
WHERE CurrentFamilyId = @FamilyId;

-- limpar a família atual
UPDATE dbo.Users
SET CurrentFamilyId = NULL
WHERE CurrentFamilyId = @FamilyId;

COMMIT;

-- Apagar a família
BEGIN TRAN;

DECLARE @FamilyId uniqueidentifier = '0754eda3-cb11-4bac-a015-6510566dad0b';

UPDATE dbo.Users
SET CurrentFamilyId = NULL
WHERE CurrentFamilyId = @FamilyId;

DELETE FROM dbo.Families
WHERE Id = @FamilyId;

COMMIT;
