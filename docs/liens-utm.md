# Liens UTM — MSD Media

À coller partout où tu mets un lien vers le site. Chaque visite arrivée par ces
liens est rangée dans GA4 sous la bonne source, apparaît dans le rapport
Telegram du samedi, et la source est jointe à toute demande envoyée depuis le
formulaire de contact (champs `source_visite`, `page_entree`, `premier_contact`).

## Règles

- `utm_source` : la plateforme, en minuscules (`linkedin`, `instagram`, `gbp`…)
- `utm_medium` : le type de canal (`social`, `organic`, `email`, `referral`, `qr`, `partner`)
- `utm_campaign` : l'emplacement ou l'opération (`profil`, `post`, `bio`, `signature`…)
- `utm_content` (facultatif) : pour distinguer deux liens d'un même post ou deux versions d'un visuel
- Jamais d'UTM sur les liens **internes** au site : ça écraserait la vraie source de la visite.

## Google Business Profile

| Emplacement | Lien |
|---|---|
| Bouton « Site web » de la fiche | `https://msd-media.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp` |
| Bouton des posts | `https://msd-media.com/?utm_source=google&utm_medium=organic&utm_campaign=gbp-post&utm_content=SUJET` |

## LinkedIn

| Emplacement | Lien |
|---|---|
| Profil Maxens (section Coordonnées / lien en vedette) | `https://msd-media.com/?utm_source=linkedin&utm_medium=social&utm_campaign=profil` |
| Page entreprise MSD Media | `https://msd-media.com/?utm_source=linkedin&utm_medium=social&utm_campaign=page-entreprise` |
| Lien dans un post (premier commentaire) | `https://msd-media.com/PAGE/?utm_source=linkedin&utm_medium=social&utm_campaign=post&utm_content=SUJET-DATE` |

## Instagram, X, YouTube

| Emplacement | Lien |
|---|---|
| Bio Instagram | `https://msd-media.com/?utm_source=instagram&utm_medium=social&utm_campaign=bio` |
| Bio X | `https://msd-media.com/?utm_source=x&utm_medium=social&utm_campaign=bio` |
| Description YouTube | `https://msd-media.com/?utm_source=youtube&utm_medium=social&utm_campaign=description` |
| Linktree (si tu le gardes) | `https://msd-media.com/?utm_source=linktree&utm_medium=social&utm_campaign=bio` |

## Email

| Emplacement | Lien |
|---|---|
| Signature email | `https://msd-media.com/?utm_source=email&utm_medium=email&utm_campaign=signature` |
| Prospection à froid | `https://msd-media.com/PAGE/?utm_source=prospection&utm_medium=email&utm_campaign=NOM-CAMPAGNE` |
| Relance devis | `https://msd-media.com/tarifs/?utm_source=email&utm_medium=email&utm_campaign=relance-devis` |

## Hors ligne

| Emplacement | Lien |
|---|---|
| QR code carte de visite | `https://msd-media.com/?utm_source=carte-visite&utm_medium=qr&utm_campaign=print` |
| QR code événement (French Tech, salon…) | `https://msd-media.com/?utm_source=NOM-EVENEMENT&utm_medium=qr&utm_campaign=evenement` |
| Pitch deck PDF (prochaine version) | `https://msd-media.com/?utm_source=pitch-deck&utm_medium=referral&utm_campaign=pdf` |

## Annuaires et partenaires

Quand la plateforme te laisse choisir le lien affiché :

| Plateforme | Lien |
|---|---|
| French Tech Alpes | `https://msd-media.com/?utm_source=ftalps&utm_medium=referral&utm_campaign=fiche-membre` |
| Sortlist | `https://msd-media.com/?utm_source=sortlist&utm_medium=referral&utm_campaign=fiche` |
| DesignRush | `https://msd-media.com/?utm_source=designrush&utm_medium=referral&utm_campaign=fiche` |
| Trustpilot | `https://msd-media.com/?utm_source=trustpilot&utm_medium=referral&utm_campaign=fiche` |
| Programme d'affiliation | `https://msd-media.com/?utm_source=affilie-NOM&utm_medium=partner&utm_campaign=affiliation` |

Attention pour les **backlinks SEO** (French Tech, Dauphiné…) : un lien avec
UTM reste valable pour Google, mais laisse l'URL propre quand c'est un article
de presse. GA4 range déjà ces visites en « referral » grâce au référent.
