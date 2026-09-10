# Origine des extraits de code

| Dossier | Dépôt source | Licence/état | Fichiers d'origine |
|---|---|---|---|
| 01_dmUtils_SmithMagic | github.com/alucas/DofusModulesUtils + github.com/DofMod/SmithMagic | public, non licencié explicitement | `src/enums/RuneWeightEnum.as`, `src/utils/SmithmagicUtils.as`, `SmithMagic/src/ui/SmithMagicUi.as` |
| 02_Nao_emu_1.29 | github.com/Dysta/Nao | public | `org/common/Formulas.java` (l.1123, 1521), `org/object/job/Job.java` (l.543-1625) |
| 03_AncestraEvolutive_1.29 | github.com/Romain-P/Ancestra-Evolutive | public | `src/common/Formulas.java` (l.752, 860), `src/objects/job/Job.java` (l.900-1200), `src/objects/Objet.java` (l.488-780) |
| 04_dofus-tools_JS | github.com/lilgallon/dofus-tools (alias N3ROO) | voir LICENSE du dépôt | `js/runes.js`, `js/forgemagie.js` (copiés intégralement) |
| 05_StarLoco_1.39 | github.com/StarLoco/StarLoco-Game | public | `src/org/starloco/locos/common/Formulas.java` (l.930-1000), `job/JobAction.java` (l.1000-2120), `object/GameObject.java` (l.860-1080), `kernel/Constant.java` (l.240-300) |

Tous les extraits sont des découpes par plage de lignes (`sed -n`) des fichiers d'origine,
sans modification du contenu. Dépôts complets clonés dans `/home/claude/fm-research/repos/`.
Code tiers : respecter les licences des dépôts d'origine avant toute réutilisation/redistribution.
