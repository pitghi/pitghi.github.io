# Site de Gabin — https://gabin-studio.fr

Site du studio **Gabin** et de son application **Maurice**. Pages statiques, sans build ni
framework, hébergées par GitHub Pages. **L'adresse du site, celle qu'on donne et qu'on met dans le
code, c'est gabin-studio.fr** : `pitghi.github.io` n'est que la mécanique de publication, et
redirige vers le domaine.

> **Ce dépôt est la seule source du site.** Jusqu'au 25/09/2026, le dossier `site/` du dépôt
> `pitghi/Maurice` en était l'original, copié ici par `rsync --delete`. Ce dossier a été supprimé :
> on modifie le site **ici, et nulle part ailleurs**. Ne jamais relancer une copie depuis une
> ancienne version de Maurice : elle effacerait le studio (tarifs, mentions légales, plan du site).

**Gabin** est le nom commercial sous lequel Paul Renauldon (entrepreneur individuel) développe des
applications mobiles, pour ses clients et pour son compte ; **Maurice** en est une. Google Play
demande le site de l'**organisation**, d'où l'accueil au nom de Gabin et la page produit Maurice à
part.

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil du **studio** : promesse, domaines, méthode, tarifs, applications, contact. Contient l'emplacement de la balise de vérification Google Search Console. |
| `mentions-legales.html` | Mentions légales du studio (éditeur, SIREN, hébergeur, propriété intellectuelle, données). |
| `maurice.html` | Page produit **Maurice** : pitch, fonctions, carrousel de captures, lien App Store. |
| `confidentialite.html` | Politique de confidentialité **de Maurice** (exigée par l'App Store et Google Play, liée depuis le paywall de l'app). |
| `supprimer-compte.html` | Procédure de suppression de compte Maurice (URL exigée par la section « Sécurité des données » de Google Play). |
| `ouvrir/index.html` | **Page de rebond des liens de partage** Maurice (carnet et invitation à un roadtrip), servie à `/ouvrir`. ⚠️ **Page critique**, voir ci-dessous. |
| `.well-known/apple-app-site-association` | **Universal Links iOS** : autorise Maurice à ouvrir `/ouvrir?c=…` et `/ouvrir?r=…` sans passer par Safari. Mise en service : `docs/universal-links.md` du dépôt Maurice. |
| `.nojekyll` | Désactive Jekyll. ⚠️ **Indispensable** : Jekyll ignore les dossiers commençant par un point, donc **`.well-known/` ne serait jamais publié** sans ce fichier. |
| `styles.css` | Palette « Noir & Blanc doux » et polices de l'app (Figtree, Noto Sans). |
| `CNAME` | Domaine personnalisé servi par GitHub Pages. ⚠️ **Ne jamais le supprimer** : sans lui, GitHub cesse de servir gabin-studio.fr. |
| `assets/` | Icône et favicon de Maurice, captures réduites, et `gabin.svg` (marque du studio). |

## Marque

Une seule marque dans l'en-tête, sur toutes les pages : le logo **Gabin**, qui ramène à l'accueil.
Les pages Maurice restent identifiées par leur titre, l'icône de leur hero et le surtitre « Une
application Gabin ». Le pied de page est un plan du site en deux colonnes, **Studio** et
**Maurice**, identique sur toutes les pages.

⚠️ **Gabin reste l'éditeur et le responsable de traitement** : le nom, l'adresse et le statut
d'entrepreneur individuel doivent rester au §1 de la politique de confidentialité et dans les
mentions légales. C'est une obligation légale, pas une question de marque. Le jour où une
**deuxième app** sort, elle aura sa propre politique : celle-ci est celle de Maurice et le dit.

## `/ouvrir` — la page de rebond des liens de partage

Quand on partage un carnet ou un roadtrip depuis l'app, le lien envoyé est
`https://gabin-studio.fr/ouvrir?c=<CODE>` (carnet) ou `?r=<CODE>` (roadtrip). La page reconnaît le
code, puis propose **d'ouvrir Maurice** ou de **télécharger l'app**. Elle n'ouvre **jamais l'app
toute seule au chargement** : chez qui n'a pas Maurice, c'est ce qui déclenche l'alerte Safari
« l'adresse n'est pas valide ». Exception : si l'appareil a déjà ouvert l'app depuis cette page
(mémorisé en `localStorage`), on bascule directement.

Les liens **envoyés avant le 18/09/2026** passent par l'Edge Function `supabase/functions/join` du
dépôt Maurice, qui redirige vers cette même page.

**À ne pas casser** : le chemin **`/ouvrir`** (d'où le dossier, et non un `ouvrir.html` — il doit
correspondre à la route `src/app/ouvrir.tsx` de Maurice, et il est écrit dans
`.well-known/apple-app-site-association`), les paramètres `?c=` et `?r=`, et les deep links
`roadtripmoto://journal/<CODE>` et `roadtripmoto://join/<CODE>`. Le lien App Store doit rester à
jour. La dépublier ou la déplacer casse tous les liens déjà partagés.

## Publier

On modifie les fichiers dans ce dépôt, sur une branche, puis on fusionne dans `main` par une PR.
GitHub Pages republie en une à deux minutes (workflow « pages build and deployment »). Le
navigateur et le CDN gardent les pages jusqu'à 10 minutes : pour vérifier, rafraîchir en forçant
(Cmd + Maj + R) ou ouvrir une fenêtre privée.

Toute modification de la politique de confidentialité doit mettre à jour la date « Dernière mise à
jour » en haut de `confidentialite.html`.

## Zone DNS (chez OVH)

Le site est servi par **GitHub Pages**, l'e-mail par **OVH**. Les deux familles d'enregistrements
coexistent dans la même zone et ne doivent pas être confondues :

| Type | Cible | À qui ça sert |
|---|---|---|
| `A` sur `@` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` | le **site** (GitHub) |
| `CNAME` sur `www` | `pitghi.github.io.` | le **site** (GitHub) |
| `MX` sur `@` | serveurs `*.mail.ovh.net` | l'**e-mail** `contact@gabin-studio.fr` — **ne jamais supprimer** |
| `TXT` SPF sur `@` | `v=spf1 include:mx.ovh.com ~all` | l'**e-mail** — **ne jamais supprimer** |

Supprimer les MX ou le SPF coupe la réception du courrier, donc l'adresse exigée par Google Play.
