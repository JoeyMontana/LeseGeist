import { Book, Category } from './types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Märchen', imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400' },
  { id: '2', name: 'Krimi', imageUrl: 'https://images.unsplash.com/photo-1455620611406-966ca6889d80?auto=format&fit=crop&q=80&w=400' },
  { id: '3', name: 'Klassiker', imageUrl: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&q=80&w=400' },
  { id: '4', name: 'Abenteuer', imageUrl: 'https://images.unsplash.com/photo-1533669955142-6a73332af4db?auto=format&fit=crop&q=80&w=400' },
  { id: '5', name: 'Romantik', imageUrl: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&q=80&w=400' },
];

export const BOOKS: Book[] = [
  {
    id: '1',
    title: 'Die Verwandlung',
    author: 'Franz Kafka',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&q=80&w=500',
    category: 'Klassiker',
    difficulty: 'B2',
    duration: 120,
    progress: 8, // Endowed-progress effect
    description: 'Gregor Samsa wakes up one morning to find himself transformed into a monstrous vermin. This masterpiece of absurdity explores alienation and family duty in a way that is both terrifying and deeply moving.',
    content: `Als Gregor Samsa eines Morgens aus unruhigen Träumen erwachte, fand er sich in seinem Bett zu einem ungeheuren Ungeziefer verwandelt. Er lag auf seinem panzerartig harten Rücken und sah, wenn er den Kopf ein wenig hob, seinen gewölbten, braunen, von bogenförmigen Versteifungen geteilten Bauch, auf dessen Höhe sich die Bettdecke, zum gänzlichen Niedergleiten bereit, kaum noch erhalten konnte. Seine vielen, im Vergleich zu seinem sonstigen Umfang kläglich dünnen Beine flimmerten ihm hilflos vor den Augen. "Was ist mit mir geschehen?" dachte er. Es war kein Traum.

Sein Zimmer, ein richtiges, nur etwas zu kleines Menschenzimmer, lag ruhig zwischen den vier wohlbekannten Wänden. Über dem Tisch, auf dem eine auseinandergepackte Musterkollektion von Tuchwaren ausgebreitet war - Samsa war Reisender -, hing das Bild, das er vor kurzem aus einer illustrierten Zeitschrift ausgeschnitten und in einen hübschen vergoldeten Rahmen untergebracht hatte. Es stellte eine Dame dar, die, mit einem Pelzhut und einer Pelzboa versehen, aufrecht dasaß und einen schweren Pelzmuff, in dem ihr ganzer Unterarm verschwunden war, dem Beschauer entgegenhob.

Gregor blickte zum Fenster hinaus, und das trübe Wetter - man hörte Regentropfen auf das Fensterblech aufschlagen - machte ihn ganz melancholisch. "Wie wäre es, wenn ich noch ein wenig weiterschliefe und alle Narrheiten vergäße", dachte er, aber das war gänzlich undurchführbar, denn er war gewöhnt, auf der rechten Seite zu schlafen, konnte sich aber in seinem gegenwärtigen Zustand nicht in diese Lage bringen.`
  },
  {
    id: '2',
    title: 'Rotkäppchen',
    author: 'Gebrüder Grimm',
    coverUrl: 'https://images.unsplash.com/photo-1596205252873-19eb4cb1160a?auto=format&fit=crop&q=80&w=500',
    category: 'Märchen',
    difficulty: 'A1',
    duration: 15,
    progress: 0,
    description: 'A little girl meets a wolf in the woods on her way to her grandmother\'s house. A classic fairy tale about caution and deception.',
    content: `Es war einmal eine kleine süße Dirne, die hatte jedermann lieb, der sie nur ansah, am allerliebsten aber ihre Großmutter, die wusste gar nicht, was sie alles dem Kind geben sollte. Einmal schenkte sie ihm ein Käppchen von rotem Sammet, und weil ihm das so wohl stand und es nichts anderes mehr tragen wollte, hieß es nur das Rotkäppchen.

Eines Tages sprach seine Mutter zu ihm: "Komm, Rotkäppchen, da hast du ein Stück Kuchen und eine Flasche Wein, bring das der Großmutter hinaus; sie ist krank und schwach und wird sich daran laben. Mach dich auf, bevor es heiß wird, und wenn du hinauskommst, so geh hübsch sittsam und lauf nicht vom Weg ab, sonst fällst du und zerbrichst das Glas, und die Großmutter hat nichts. Und wenn du in ihre Stube kommst, so vergiss nicht, guten Morgen zu sagen, und guck nicht erst in alle Ecken herum."

"Ich will schon alles gut machen", sagte Rotkäppchen zur Mutter und gab ihr die Hand darauf. Die Großmutter aber wohnte draußen im Wald, eine halbe Stunde vom Dorf. Wie nun Rotkäppchen in den Wald kam, begegnete ihm der Wolf. Rotkäppchen aber wusste nicht, was das für ein böses Tier war, und fürchtete sich nicht vor ihm.`
  },
  {
    id: '3',
    title: 'Der Sandmann',
    author: 'E.T.A. Hoffmann',
    coverUrl: 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?auto=format&fit=crop&q=80&w=500',
    category: 'Klassiker',
    difficulty: 'C1',
    duration: 45,
    progress: 2,
    description: 'A dark romantic tale blurring the lines between reality and delusion, featuring the terrifying Sandman who steals children\'s eyes.',
    content: `Brief von Nathanael an Lothar. Gewiss seid ihr alle voll Unruhe, dass ich so lange, lange nicht geschrieben. Mutter zürnt wohl, und Clara mag glauben, ich lebe hier in Saus und Braus und vergesse mein holdes Engelsbild, so tief mir in Herz und Sinn eingeprägt, ganz und gar. Dem ist aber nicht so; täglich und stündlich gedenke ich Eurer.

Und mein Bruder Lothar! wie oft habe ich dich herbeigesehnt, dich, der du so gemütlich und ernst und doch so geneigt bist, meinen phantastischen Launen, wie es der Professor der Ästhetik nennt, einen Spielraum zu gönnen!

Nun ist es aber auch in der Tat so, dass mir Entsetzliches begegnet ist. Dunkle Ahnungen eines grässlichen, mich bedrohenden Geschicks breiten sich wie schwarze Wolkenschatten über mein Leben aus. Ich muss dir alles erzählen, und weiß doch nicht, wie ich anfangen, wie ich dich stimmen soll, dass du mein seltsames Gefühl verstehst. Wenn ich dir sage, dass ich vor einigen Tagen einen Wetterglashändler, der mir Barometer und Thermometer in meine Stube trug, zur Türe hinauswarf, so wirst du gewiss lachen und denken, ich sei wieder einmal in meinen bekannten Grillen.`
  },
  {
    id: '4',
    title: 'Heidi',
    author: 'Johanna Spyri',
    coverUrl: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&q=80&w=500',
    category: 'Abenteuer',
    difficulty: 'A2',
    duration: 180,
    progress: 0,
    description: 'The story of an orphan girl sent to live with her grandfather in the Swiss Alps. A heartwarming tale of nature, friendship, and childhood.',
    content: `Vom freundlichen Dorfe Maienfeld führt ein Fußweg durch grüne, baumreiche Fluren bis zum Fuße der Höhen, die von dieser Seite groß und ernst auf das Tal herniederschauen. Wo der Weg anfängt, da beginnt bald die Heide mit dem kurzen Gras und den vielen Bergkräutern, dem Wanderer entgegenzuduften.

Weil der Weg steil und direkt zu den Alpen hinaufführt, nennt man ihn den Geißenpfad. Hier geht das Heidi oft hinauf, wenn der Peter die Geißen auf die Weide treibt.

Der Großvater sitzt vor seiner Hütte und schaut ins Tal hinunter, wenn die Sonne untergeht und die Berge in rotem Feuer glühen. Er raucht seine Pfeife und denkt an alte Zeiten, während das Heidi mit den Ziegen spielt und lacht.`
  },
  {
    id: '5',
    title: 'Der Vorleser',
    author: 'Bernhard Schlink',
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=500',
    category: 'Romantik',
    difficulty: 'B1',
    duration: 200,
    progress: 15,
    description: 'A young man falls in love with an older woman, only to discover a dark secret from her past years later. A compelling exploration of guilt and memory.',
    content: `Als ich fünfzehn war, hatte ich Gelbsucht. Die Krankheit fing im Herbst an und endete im Frühjahr. Je kälter und dunkler das alte Jahr wurde, desto schwächer wurde ich. Erst mit dem neuen Jahr ging es aufwärts. Der Januar war warm, und meine Mutter richtete mir das Bett auf dem Balkon her.

Ich sah den Himmel, die Sonne, die Wolken und hörte die Kinder im Hof spielen. Eines Tages, im Februar, kam eine Frau in den Hof und hängte Wäsche auf. Sie trug ein graues Kleid und hatte kräftige Arme. Ich beobachtete sie, wie sie die weißen Laken in den Wind hängte. Sie schaute zu mir herauf und lächelte. Das war Hanna.

Später, als ich wieder gesund war, besuchte ich sie. Sie wohnte in der Bahnhofstraße, in einem alten Haus mit hohen Decken und dunklen Fluren.`
  }
];