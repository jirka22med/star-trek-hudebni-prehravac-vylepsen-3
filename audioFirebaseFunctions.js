// audioFirebaseFunctions.js
// Tento soubor obsahuje Firebase logiku pro audio přehrávač.
(function() {
    'use strict';

const DEBUG_COLOUDE_FIRESTORE = false; // Globální přepínač pro logování: true = zapnuto, false = vypnuto

// !!! Zde je tvůj konfigurační objekt, který jsi mi poslal !!!
const firebaseConfig = {
    apiKey: "AIzaSyCxO2BdPLkvRW9q3tZTW5J39pjjAoR-9Sk", // Tvoje API Key
    authDomain: "audio-prehravac-v-3.firebaseapp.com", // Tvoje Auth Domain
    projectId: "audio-prehravac-v-3", // Tvoje Project ID
    storageBucket: "audio-prehravac-v-3.firebasestorage.app", // Tvoje Storage Bucket
    messagingSenderId: "343140348126", // Tvoje Messaging Sender ID
    appId: "1:343140348126:web:c61dc969efb6dcb547524f" // Tvoje App ID
    //measurementId: "G-6QSYEY22N6" // Pokud nepoužíváš Analytics, může být zakomentováno
};

// Log pro potvrzení, že firebaseConfig byl načten
if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Konfigurační objekt Firebase načten a připraven.", firebaseConfig.projectId);

let db; // Proměnná pro instanci Firestore databáze

// Inicializace Firebase aplikace a Firestore databáze
// Nyní asynchronní, aby počkala na plné načtení Firebase SDK
window.initializeFirebaseAppAudio = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Spuštěna inicializace Firebase aplikace pro audio přehrávač.");

    return new Promise((resolve, reject) => {
        const checkFirebaseReady = setInterval(() => {
            // Kontrolujeme, zda jsou globální objekty a metody Firebase plně načteny
            if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function' && typeof firebase.firestore === 'function') {
                clearInterval(checkFirebaseReady); // Zastavíme kontrolu, Firebase je připraveno
                if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Firebase SDK (app & firestore) detekováno a připraveno.");
                
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Firebase aplikace inicializována.");
                } else {
                    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Firebase aplikace již byla inicializována (přeskakuji).");
                }
                
                db = firebase.firestore();
                if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Firestore databáze připravena pro audio přehrávač.");
                resolve(true); // Signalizuje úspěšnou inicializaci
            } else {
                if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Čekám na načtení Firebase SDK (včetně firestore modulu)...");
            }
        }, 100); // Kontrolujeme každých 100ms
    });
};

// --- FUNKCE PRO UKLÁDÁNÍ DAT DO FIRESTORE ---

// Ukládá celý playlist do Firestore
window.savePlaylistToFirestore = async function(playlistArray) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o uložení playlistu do Firestore.", playlistArray);
    if (!db) {
        //console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze uložit playlist.");
        // Voláme globální showNotification, která by měla být definována v index.html
        window.showNotification("Chyba: Databáze není připravena k uložení playlistu!", 'error');
        throw new Error("Firestore databáze není připravena k uložení playlistu.");
    }

    // Pro jednoduchost uložíme celý playlist jako jeden dokument.
    const playlistDocRef = db.collection('audioPlaylists').doc('mainPlaylist'); 
    
    try {
        await playlistDocRef.set({ tracks: playlistArray }); // Uloží pole skladeb pod klíčem 'tracks'
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Playlist úspěšně uložen do Firestore.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při ukládání playlistu do Firestore:", error);
        window.showNotification("Chyba při ukládání playlistu do cloudu!", 'error');
        throw error;
    }
};

// Ukládá oblíbené skladby do Firestore
window.saveFavoritesToFirestore = async function(favoritesArray) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o uložení oblíbených do Firestore.", favoritesArray);
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze uložit oblíbené.");
        window.showNotification("Chyba: Databáze není připravena k uložení oblíbených!", 'error');
        throw new Error("Firestore databáze není připravena k uložení oblíbených.");
    }

    const favoritesDocRef = db.collection('audioPlayerSettings').doc('favorites'); 
    
    try {
        await favoritesDocRef.set({ titles: favoritesArray }, { merge: true }); 
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Oblíbené skladby úspěšně uloženy do Firestore.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při ukládání oblíbených do Firestore:", error);
        window.showNotification("Chyba při ukládání oblíbených do cloudu!", 'error');
        throw error;
    }
};

// Ukládá nastavení přehrávače (např. shuffle, loop, lastPlayedIndex) do Firestore
window.savePlayerSettingsToFirestore = async function(settingsObject) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o uložení nastavení přehrávače do Firestore.", settingsObject);
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze uložit nastavení přehrávače.");
        window.showNotification("Chyba: Databáze není připravena k uložení nastavení přehrávače!", 'error');
        throw new Error("Firestore databáze není připravena k uložení nastavení přehrávače.");
    }

    const playerSettingsDocRef = db.collection('audioPlayerSettings').doc('mainSettings'); 
    
    try {
        await playerSettingsDocRef.set(settingsObject, { merge: true }); 
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Nastavení přehrávače úspěšně uložena do Firestore.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při ukládání nastavení přehrávače do Firestore:", error);
        window.showNotification("Chyba při ukládání nastavení přehrávače do cloudu!", 'error');
        throw error;
    }
};


// --- FUNKCE PRO NAČÍTÁNÍ DAT Z FIRESTORE ---

// Načítá playlist z Firestore
window.loadPlaylistFromFirestore = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o načtení playlistu z Firestore.");
    if (!db) {
        //console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze načíst playlist.");
        return null; 
    }

    try {
        const doc = await db.collection('audioPlaylists').doc('mainPlaylist').get();
        if (doc.exists && doc.data().tracks) {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Playlist úspěšně načten z Firestore.", doc.data().tracks.length, "skladeb.");
            return doc.data().tracks; 
        } else {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Dokument s playlistem 'mainPlaylist' neexistuje nebo je prázdný.");
            return null;
        }
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při načítání playlistu z Firestore:", error);
        window.showNotification("Chyba při načítání playlistu z cloudu!", 'error');
        throw error;
    }
};

// Načítá oblíbené skladby z Firestore
window.loadFavoritesFromFirestore = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o načtení oblíbených z Firestore.");
    if (!db) {
       // console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze načíst oblíbené.");
        return null;
    }

    try {
        const doc = await db.collection('audioPlayerSettings').doc('favorites').get();
        if (doc.exists && doc.data().titles) {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Oblíbené skladby úspěšně načteny z Firestore.", doc.data().titles.length, "oblíbených.");
            return doc.data().titles; 
        } else {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Dokument s oblíbenými 'favorites' neexistuje nebo je prázdný.");
            return null;
        }
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při načítání oblíbených z Firestore:", error);
        window.showNotification("Chyba při načítání oblíbených z cloudu!", 'error');
        throw error;
    }
};

// Načítá nastavení přehrávače z Firestore
window.loadPlayerSettingsFromFirestore = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o načtení nastavení přehrávače z Firestore.");
    if (!db) {
        //console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze načíst nastavení přehrávače.");
        return null;
    }

    try {
        const doc = await db.collection('audioPlayerSettings').doc('mainSettings').get();
        if (doc.exists) {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Nastavení přehrávače úspěšně načtena z Firestore.", doc.data());
            return doc.data(); 
        } else {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Dokument s nastavením přehrávače 'mainSettings' neexistuje.");
            return null;
        }
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při načítání nastavení přehrávače z Firestore:", error);
        window.showNotification("Chyba při načítání nastavení přehrávače z cloudu!", 'error');
        throw error;
    }
};


// --- FUNKCE PRO SMAZÁNÍ DAT Z FIRESTORE (POZOR! DŮRAZNĚ!) ---

// Funkce pro smazání všech dat ze všech kolekcí audio přehrávače
window.clearAllAudioFirestoreData = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o smazání VŠECH dat audio přehrávače z Firestore (všechny určené kolekce).");
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze smazat všechna data.");
        window.showNotification("Chyba: Databáze není připravena k mazání všech dat!", 'error');
        throw new Error("Firestore databáze není připravena ke smazání všech dat.");
    }

    try {
        const collectionsToClear = ['audioPlaylists', 'audioPlayerSettings']; // Kolekce specifické pro audio přehrávač
        let totalDeletedCount = 0;

        for (const collectionName of collectionsToClear) {
            if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Spouštím mazání dokumentů z kolekce '${collectionName}'.`);
            const collectionRef = db.collection(collectionName);
            const snapshot = await collectionRef.get();
            const batch = db.batch();
            let deletedInCollection = 0;

            if (snapshot.size === 0) {
                if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Kolekce '${collectionName}' je již prázdná.`);
                continue; 
            }

            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                deletedInCollection++;
            });

            if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Přidáno ${deletedInCollection} dokumentů z kolekce '${collectionName}' do dávky pro smazání.`);
            await batch.commit();
            if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Smazáno ${deletedInCollection} dokumentů z kolekce '${collectionName}'.`);
            totalDeletedCount += deletedInCollection;
        }
        
        if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Všechna data audio přehrávače z Firestore úspěšně smazána. Celkem smazáno: ${totalDeletedCount} dokumentů.`);
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při mazání všech dat z Firestore:", error);
        window.showNotification("Chyba při mazání všech dat z cloudu!", 'error');
        throw error;
    }
};
 
//tady začíná playlit konfigurace?$



// Rozšíření pro audioFirebaseFunctions.js
// Přidej tento kód na konec svého audioFirebaseFunctions.js souboru

// --- FUNKCE PRO UKLÁDÁNÍ A NAČÍTÁNÍ NASTAVENÍ PLAYLISTU ---

// Ukládá nastavení playlistu (vzhled, styly, chování) do Firestore
window.savePlaylistSettingsToFirestore = async function(playlistSettingsObject) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o uložení nastavení playlistu do Firestore.", playlistSettingsObject);
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze uložit nastavení playlistu.");
        window.showNotification("Chyba: Databáze není připravena k uložení nastavení playlistu!", 'error');
        throw new Error("Firestore databáze není připravena k uložení nastavení playlistu.");
    }

    const playlistSettingsDocRef = db.collection('audioPlayerSettings').doc('playlistSettings'); 
    
    try {
        // Přidáváme timestamp pro sledování posledních změn
        const settingsWithTimestamp = {
            ...playlistSettingsObject,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            version: "1.0" // Pro případné budoucí migrace
        };

        await playlistSettingsDocRef.set(settingsWithTimestamp, { merge: true }); 
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Nastavení playlistu úspěšně uložena do Firestore.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při ukládání nastavení playlistu do Firestore:", error);
        window.showNotification("Chyba při ukládání nastavení playlistu do cloudu!", 'error');
        throw error;
    }
};

// Načítá nastavení playlistu z Firestore
window.loadPlaylistSettingsFromFirestore = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o načtení nastavení playlistu z Firestore.");
    if (!db) {
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze načíst nastavení playlistu.");
        return null;
    }

    try {
        const doc = await db.collection('audioPlayerSettings').doc('playlistSettings').get();
        if (doc.exists) {
            const data = doc.data();
            
            // Odstraníme metadata před vrácením nastavení
            const { lastUpdated, version, ...playlistSettings } = data;
            
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Nastavení playlistu úspěšně načtena z Firestore.", playlistSettings);
            if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Nastavení playlistu - verze: ${version || 'neznámá'}, poslední aktualizace:`, lastUpdated?.toDate?.() || 'neznámá');
            
            return playlistSettings;
        } else {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Dokument s nastavením playlistu 'playlistSettings' neexistuje.");
            return null;
        }
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při načítání nastavení playlistu z Firestore:", error);
        window.showNotification("Chyba při načítání nastavení playlistu z cloudu!", 'error');
        return null; // Vrátíme null místo throw, aby se aplikace nezhroutila
    }
};

// Smazání nastavení playlistu z Firestore
window.clearPlaylistSettingsFromFirestore = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o smazání nastavení playlistu z Firestore.");
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze smazat nastavení playlistu.");
        window.showNotification("Chyba: Databáze není připravena k mazání nastavení playlistu!", 'error');
        throw new Error("Firestore databáze není připravena ke smazání nastavení playlistu.");
    }

    try {
        const playlistSettingsDocRef = db.collection('audioPlayerSettings').doc('playlistSettings');
        await playlistSettingsDocRef.delete();
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Nastavení playlistu úspěšně smazána z Firestore.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při mazání nastavení playlistu z Firestore:", error);
        window.showNotification("Chyba při mazání nastavení playlistu z cloudu!", 'error');
        throw error;
    }
};

// Export/Backup nastavení playlistu do JSON formátu uložený v Firestore
window.backupPlaylistSettingsToFirestore = async function(backupName = null) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o vytvoření zálohy nastavení playlistu.");
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze vytvořit zálohu.");
        throw new Error("Firestore databáze není připravena k vytvoření zálohy.");
    }

    try {
        // Nejdříve načteme aktuální nastavení
        const currentSettings = await window.loadPlaylistSettingsFromFirestore();
        if (!currentSettings) {
            throw new Error("Žádná nastavení playlistu k zálohování nenalezena.");
        }

        // Vytvoříme název zálohy
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const finalBackupName = backupName || `backup-${timestamp}`;

        // Uložíme zálohu
        const backupDocRef = db.collection('audioPlayerSettings').doc('backups').collection('playlistSettingsBackups').doc(finalBackupName);
        
        await backupDocRef.set({
            ...currentSettings,
            backupCreated: firebase.firestore.FieldValue.serverTimestamp(),
            backupName: finalBackupName
        });

        if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Záloha nastavení playlistu úspěšně vytvořena: ${finalBackupName}`);
        return finalBackupName;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při vytváření zálohy nastavení playlistu:", error);
        window.showNotification("Chyba při vytváření zálohy nastavení!", 'error');
        throw error;
    }
};

// Obnovení nastavení playlistu ze zálohy
window.restorePlaylistSettingsFromBackup = async function(backupName) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Pokus o obnovení nastavení playlistu ze zálohy: ${backupName}`);
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze obnovit ze zálohy.");
        throw new Error("Firestore databáze není připravena k obnovení ze zálohy.");
    }

    try {
        const backupDocRef = db.collection('audioPlayerSettings').doc('backups').collection('playlistSettingsBackups').doc(backupName);
        const doc = await backupDocRef.get();
        
        if (!doc.exists) {
            throw new Error(`Záloha '${backupName}' nebyla nalezena.`);
        }

        const backupData = doc.data();
        const { backupCreated, backupName: originalBackupName, ...settingsToRestore } = backupData;

        // Uložíme obnovená nastavení jako aktuální
        await window.savePlaylistSettingsToFirestore(settingsToRestore);
        
        if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Nastavení playlistu úspěšně obnovena ze zálohy: ${backupName}`);
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Záloha byla vytvořena:", backupCreated?.toDate?.());
        
        return settingsToRestore;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při obnovování nastavení ze zálohy:", error);
        window.showNotification(`Chyba při obnovování ze zálohy: ${error.message}`, 'error');
        throw error;
    }
};

// Seznam dostupných záloh nastavení playlistu
window.listPlaylistSettingsBackups = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o načtení seznamu záloh nastavení playlistu.");
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze načíst seznam záloh.");
        return [];
    }

    try {
        const backupsCollectionRef = db.collection('audioPlayerSettings').doc('backups').collection('playlistSettingsBackups');
        const snapshot = await backupsCollectionRef.orderBy('backupCreated', 'desc').get();
        
        const backups = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            backups.push({
                id: doc.id,
                name: data.backupName || doc.id,
                created: data.backupCreated?.toDate?.() || null,
                settingsCount: Object.keys(data).length - 2 // -2 pro backupCreated a backupName
            });
        });

        if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Nalezeno ${backups.length} záloh nastavení playlistu.`);
        return backups;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při načítání seznamu záloh:", error);
        window.showNotification("Chyba při načítání seznamu záloh!", 'error');
        return [];
    }
};

// Smazání konkrétní zálohy nastavení playlistu  
window.deletePlaylistSettingsBackup = async function(backupName) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Pokus o smazání zálohy nastavení playlistu: ${backupName}`);
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze smazat zálohu.");
        throw new Error("Firestore databáze není připravena ke smazání zálohy.");
    }

    try {
        const backupDocRef = db.collection('audioPlayerSettings').doc('backups').collection('playlistSettingsBackups').doc(backupName);
        await backupDocRef.delete();
        
        if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Záloha nastavení playlistu '${backupName}' úspěšně smazána.`);
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při mazání zálohy:", error);
        window.showNotification(`Chyba při mazání zálohy: ${error.message}`, 'error');
        throw error;
    }
};

// --- AKTUALIZACE EXISTUJÍCÍ clearAllAudioFirestoreData FUNKCE ---
// Přepis stávající funkce, aby zahrnovala i nastavení playlistu

const originalClearAllAudioFirestoreData = window.clearAllAudioFirestoreData;

window.clearAllAudioFirestoreData = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o smazání VŠECH dat audio přehrávače z Firestore (včetně nastavení playlistu).");
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze smazat všechna data.");
        window.showNotification("Chyba: Databáze není připravena k mazání všech dat!", 'error');
        throw new Error("Firestore databáze není připravena ke smazání všech dat.");
    }

    try {
        // Nejdříve zavoláme původní funkci
        await originalClearAllAudioFirestoreData();
        
        // Poté smažeme i zálohy nastavení playlistu
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Mažu všechny zálohy nastavení playlistu...");
        const backupsCollectionRef = db.collection('audioPlayerSettings').doc('backups').collection('playlistSettingsBackups');
        const backupsSnapshot = await backupsCollectionRef.get();
        
        const backupsBatch = db.batch();
        let deletedBackupsCount = 0;
        
        backupsSnapshot.docs.forEach(doc => {
            backupsBatch.delete(doc.ref);
            deletedBackupsCount++;
        });
        
        if (deletedBackupsCount > 0) {
            await backupsBatch.commit();
            if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Smazáno ${deletedBackupsCount} záloh nastavení playlistu.`);
        } else {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Žádné zálohy nastavení playlistu k smazání.");
        }
        
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Všechna data audio přehrávače včetně nastavení playlistu a záloh úspěšně smazána.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při mazání všech dat z Firestore:", error);
        window.showNotification("Chyba při mazání všech dat z cloudu!", 'error');
        throw error;
    }
};

// Utility funkce pro debugging nastavení playlistu
window.debugPlaylistSettings = async function() {
    if (!db) {
        if (DEBUG_COLOUDE_FIRESTORE) console.log("DEBUG: Firestore databáze není inicializována.");
        return;
    }
    
    try {
        if (DEBUG_COLOUDE_FIRESTORE) console.log("=== DEBUG: Playlist Settings ===");
        
        // Načteme aktuální nastavení
        const settings = await window.loadPlaylistSettingsFromFirestore();
        if (DEBUG_COLOUDE_FIRESTORE) console.log("Aktuální nastavení:", settings);
        
        // Načteme seznam záloh
        const backups = await window.listPlaylistSettingsBackups();
        if (DEBUG_COLOUDE_FIRESTORE) console.log("Dostupné zálohy:", backups);
        
        // Informace o dokumentech v kolekci
        const doc = await db.collection('audioPlayerSettings').doc('playlistSettings').get();
        if (DEBUG_COLOUDE_FIRESTORE) console.log("Dokument existuje:", doc.exists);
        if (doc.exists) {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("Velikost dokumentu (přibližně):", JSON.stringify(doc.data()).length, "znaků");
        }
        
        if (DEBUG_COLOUDE_FIRESTORE) console.log("=== END DEBUG ===");
    } catch (error) {
        console.error("DEBUG: Chyba při ladění nastavení playlistu:", error);
    }
};

if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Rozšíření pro nastavení playlistu načteno a připraveno.");



//správa viditelnosti tlačítek

// === FIREBASE ROZŠÍŘENÍ PRO SPRÁVU VIDITELNOSTI TLAČÍTEK ===
// Přidej tento kód na konec svého audioFirebaseFunctions.js souboru
// Více admirál Jiřík & Admirál Claude.AI - Hvězdná flotila

if (DEBUG_COLOUDE_FIRESTORE) console.log("🖖 Načítám Firebase rozšíření pro správu viditelnosti tlačítek...");

// --- UKLÁDÁNÍ KONFIGURACE VIDITELNOSTI TLAČÍTEK ---

// Ukládá konfiguraci viditelnosti tlačítek do Firestore
window.saveButtonVisibilityToFirestore = async function(visibilityConfigObject) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o uložení konfigurace viditelnosti tlačítek do Firestore.", visibilityConfigObject);
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze uložit konfiguraci viditelnosti.");
        window.showNotification("Chyba: Databáze není připravena k uložení konfigurace viditelnosti!", 'error');
        throw new Error("Firestore databáze není připravena k uložení konfigurace viditelnosti.");
    }

    const visibilityDocRef = db.collection('audioPlayerSettings').doc('buttonVisibilityConfig');
    
    try {
        // Přidáváme metadata pro sledování změn
        const configWithMetadata = {
            ...visibilityConfigObject,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            version: "1.0",
            deviceInfo: {
                userAgent: navigator.userAgent.substring(0, 100), // Ořez pro Firestore limit
                platform: navigator.platform,
                language: navigator.language
            },
            configHash: generateConfigHash(visibilityConfigObject) // Pro detekci změn
        };

        await visibilityDocRef.set(configWithMetadata, { merge: true });
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Konfigurace viditelnosti tlačítek úspěšně uložena do Firestore.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při ukládání konfigurace viditelnosti do Firestore:", error);
        window.showNotification("Chyba při ukládání konfigurace viditelnosti do cloudu!", 'error');
        throw error;
    }
};

// --- NAČÍTÁNÍ KONFIGURACE VIDITELNOSTI TLAČÍTEK ---

// Načítá konfiguraci viditelnosti tlačítek z Firestore
window.loadButtonVisibilityFromFirestore = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o načtení konfigurace viditelnosti tlačítek z Firestore.");
    if (!db) {
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze načíst konfiguraci viditelnosti.");
        return null;
    }

    try {
        const doc = await db.collection('audioPlayerSettings').doc('buttonVisibilityConfig').get();
        if (doc.exists) {
            const data = doc.data();
            
            // Odstraníme metadata před vrácením konfigurace
            const { lastUpdated, version, deviceInfo, configHash, ...visibilityConfig } = data;
            
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Konfigurace viditelnosti tlačítek úspěšně načtena z Firestore.", visibilityConfig);
            if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Konfigurace viditelnosti - verze: ${version || 'neznámá'}, poslední aktualizace:`, lastUpdated?.toDate?.() || 'neznámá');
            if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Hash konfigurace: ${configHash || 'neznámý'}`);
            
            return visibilityConfig;
        } else {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Dokument s konfigurací viditelnosti tlačítek neexistuje.");
            return null;
        }
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při načítání konfigurace viditelnosti z Firestore:", error);
        window.showNotification("Chyba při načítání konfigurace viditelnosti z cloudu!", 'error');
        return null; // Vrátíme null místo throw, aby se aplikace nezhroutila
    }
};

// --- ZÁLOHOVÁNÍ KONFIGURACE VIDITELNOSTI ---

// Vytvoří zálohu konfigurace viditelnosti tlačítek
window.backupButtonVisibilityToFirestore = async function(backupName = null, currentConfig = null) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o vytvoření zálohy konfigurace viditelnosti tlačítek.");
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze vytvořit zálohu.");
        throw new Error("Firestore databáze není připravena k vytvoření zálohy.");
    }

    try {
        // Pokud není config poskytnut, načteme aktuální
        let configToBackup = currentConfig;
        if (!configToBackup) {
            configToBackup = await window.loadButtonVisibilityFromFirestore();
            if (!configToBackup) {
                throw new Error("Žádná konfigurace viditelnosti tlačítek k zálohování nenalezena.");
            }
        }

        // Vytvoříme název zálohy
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const finalBackupName = backupName || `visibility-backup-${timestamp}`;

        // Uložíme zálohu
        const backupDocRef = db.collection('audioPlayerSettings')
            .doc('backups')
            .collection('buttonVisibilityBackups')
            .doc(finalBackupName);
        
        await backupDocRef.set({
            ...configToBackup,
            backupCreated: firebase.firestore.FieldValue.serverTimestamp(),
            backupName: finalBackupName,
            backupType: 'buttonVisibility',
            originalHash: generateConfigHash(configToBackup)
        });

        if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Záloha konfigurace viditelnosti úspěšně vytvořena: ${finalBackupName}`);
        return finalBackupName;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při vytváření zálohy konfigurace viditelnosti:", error);
        window.showNotification("Chyba při vytváření zálohy konfigurace viditelnosti!", 'error');
        throw error;
    }
};

// --- OBNOVENÍ Z ZÁLOHY ---

// Obnoví konfiguraci viditelnosti ze zálohy
window.restoreButtonVisibilityFromBackup = async function(backupName) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Pokus o obnovení konfigurace viditelnosti ze zálohy: ${backupName}`);
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze obnovit ze zálohy.");
        throw new Error("Firestore databáze není připravena k obnovení ze zálohy.");
    }

    try {
        const backupDocRef = db.collection('audioPlayerSettings')
            .doc('backups')
            .collection('buttonVisibilityBackups')
            .doc(backupName);
        const doc = await backupDocRef.get();
        
        if (!doc.exists) {
            throw new Error(`Záloha '${backupName}' nebyla nalezena.`);
        }

        const backupData = doc.data();
        const { backupCreated, backupName: originalBackupName, backupType, originalHash, ...configToRestore } = backupData;

        // Ověříme integritu zálohy
        const restoredHash = generateConfigHash(configToRestore);
        if (originalHash && originalHash !== restoredHash) {
            if (DEBUG_COLOUDE_FIRESTORE) console.warn("audioFirebaseFunctions.js: Varování - hash zálohy se neshoduje, možná je poškozená.");
        }

        // Uložíme obnovenou konfiguraci jako aktuální
        await window.saveButtonVisibilityToFirestore(configToRestore);
        
        if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Konfigurace viditelnosti úspěšně obnovena ze zálohy: ${backupName}`);
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Záloha byla vytvořena:", backupCreated?.toDate?.());
        
        return configToRestore;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při obnovování konfigurace ze zálohy:", error);
        window.showNotification(`Chyba při obnovování ze zálohy: ${error.message}`, 'error');
        throw error;
    }
};

// --- SEZNAM ZÁLOH ---

// Načte seznam dostupných záloh konfigurace viditelnosti
window.listButtonVisibilityBackups = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o načtení seznamu záloh konfigurace viditelnosti.");
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze načíst seznam záloh.");
        return [];
    }

    try {
        const backupsCollectionRef = db.collection('audioPlayerSettings')
            .doc('backups')
            .collection('buttonVisibilityBackups');
        const snapshot = await backupsCollectionRef.orderBy('backupCreated', 'desc').get();
        
        const backups = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            backups.push({
                id: doc.id,
                name: data.backupName || doc.id,
                created: data.backupCreated?.toDate?.() || null,
                type: data.backupType || 'buttonVisibility',
                configCount: Object.keys(data).filter(key => !['backupCreated', 'backupName', 'backupType', 'originalHash'].includes(key)).length,
                hash: data.originalHash || 'neznámý'
            });
        });

        if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Nalezeno ${backups.length} záloh konfigurace viditelnosti.`);
        return backups;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při načítání seznamu záloh viditelnosti:", error);
        window.showNotification("Chyba při načítání seznamu záloh konfigurace viditelnosti!", 'error');
        return [];
    }
};

// --- SMAZÁNÍ ZÁLOHY ---

// Smaže konkrétní zálohu konfigurace viditelnosti
window.deleteButtonVisibilityBackup = async function(backupName) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Pokus o smazání zálohy konfigurace viditelnosti: ${backupName}`);
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze smazat zálohu.");
        throw new Error("Firestore databáze není připravena ke smazání zálohy.");
    }

    try {
        const backupDocRef = db.collection('audioPlayerSettings')
            .doc('backups')
            .collection('buttonVisibilityBackups')
            .doc(backupName);
        await backupDocRef.delete();
        
        if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Záloha konfigurace viditelnosti '${backupName}' úspěšně smazána.`);
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při mazání zálohy konfigurace viditelnosti:", error);
        window.showNotification(`Chyba při mazání zálohy konfigurace viditelnosti: ${error.message}`, 'error');
        throw error;
    }
};

// --- SMAZÁNÍ KONFIGURACE ---

// Smaže aktuální konfiguraci viditelnosti z Firestore
window.clearButtonVisibilityFromFirestore = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o smazání konfigurace viditelnosti z Firestore.");
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze smazat konfiguraci.");
        throw new Error("Firestore databáze není připravena ke smazání konfigurace viditelnosti.");
    }

    try {
        const visibilityDocRef = db.collection('audioPlayerSettings').doc('buttonVisibilityConfig');
        await visibilityDocRef.delete();
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Konfigurace viditelnosti tlačítek úspěšně smazána z Firestore.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při mazání konfigurace viditelnosti z Firestore:", error);
        window.showNotification("Chyba při mazání konfigurace viditelnosti z cloudu!", 'error');
        throw error;
    }
};

// --- SYNCHRONIZACE KONFIGURACE ---

// Synchronizuje místní konfiguraci s cloudem
window.syncButtonVisibilityWithFirestore = async function(localConfig = null) {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Spouštím synchronizaci konfigurace viditelnosti s cloudem.");
    if (!db) {
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Firestore není k dispozici, synchronizace přeskočena.");
        return { success: false, reason: 'firebase_not_available' };
    }

    try {
        // Načteme konfiguraci z cloudu
        const cloudConfig = await window.loadButtonVisibilityFromFirestore();
        
        if (!localConfig) {
            // Pokud není lokální config poskytnut, načteme z localStorage
            const stored = localStorage.getItem('buttonVisibility');
            localConfig = stored ? JSON.parse(stored) : null;
        }

        let result = { success: true };

        if (!cloudConfig && localConfig) {
            // Cloud je prázdný, ale máme lokální - nahraj do cloudu
            await window.saveButtonVisibilityToFirestore(localConfig);
            result.action = 'uploaded_to_cloud';
            result.message = 'Lokální konfigurace nahrána do cloudu';
            
        } else if (cloudConfig && !localConfig) {
            // Cloud má konfiguraci, ale lokálně není - stáhni z cloudu
            localStorage.setItem('buttonVisibility', JSON.stringify(cloudConfig));
            result.action = 'downloaded_from_cloud';
            result.message = 'Konfigurace stažena z cloudu';
            result.config = cloudConfig;
            
        } else if (cloudConfig && localConfig) {
            // Obě konfigurace existují - porovnej hashe
            const localHash = generateConfigHash(localConfig);
            const cloudHash = generateConfigHash(cloudConfig);
            
            if (localHash !== cloudHash) {
                // Konfigurace se liší - použij novější
                const cloudDoc = await db.collection('audioPlayerSettings').doc('buttonVisibilityConfig').get();
                const cloudTimestamp = cloudDoc.exists ? cloudDoc.data().lastUpdated?.toDate?.() : null;
                const localTimestamp = new Date(localStorage.getItem('buttonVisibilityLastModified') || 0);
                
                if (cloudTimestamp && cloudTimestamp > localTimestamp) {
                    // Cloud je novější
                    localStorage.setItem('buttonVisibility', JSON.stringify(cloudConfig));
                    result.action = 'updated_from_cloud';
                    result.message = 'Aktualizováno z cloudu (novější verze)';
                    result.config = cloudConfig;
                } else {
                    // Lokální je novější nebo stejně starý
                    await window.saveButtonVisibilityToFirestore(localConfig);
                    result.action = 'updated_cloud';
                    result.message = 'Cloud aktualizován lokální konfigurací';
                }
            } else {
                result.action = 'no_changes';
                result.message = 'Konfigurace je synchronizovaná';
            }
            
        } else {
            // Ani cloud ani lokální konfigurace neexistuje
            result.action = 'no_config';
            result.message = 'Žádná konfigurace k synchronizaci';
        }

        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Synchronizace dokončena:", result);
        return result;
        
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při synchronizaci konfigurace viditelnosti:", error);
        return { success: false, error: error.message };
    }
};

// --- POMOCNÉ FUNKCE ---

// Generuje hash konfigurace pro detekci změn
function generateConfigHash(config) {
    if (!config || typeof config !== 'object') return 'empty';
    
    try {
        // Vytvoříme deterministický string z konfigurace
        const sortedKeys = Object.keys(config).sort();
        const configString = sortedKeys.map(key => `${key}:${config[key]}`).join('|');
        
        // Jednoduchý hash algoritmus
        let hash = 0;
        for (let i = 0; i < configString.length; i++) {
            const char = configString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Převede na 32bit integer
        }
        
        return Math.abs(hash).toString(16);
    } catch (error) {
        console.error("Chyba při generování hash konfigurace:", error);
        return 'error';
    }
}

// Automatická synchronizace při načtení stránky
window.autoSyncButtonVisibilityOnLoad = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Spouštím automatickou synchronizaci konfigurace viditelnosti při načtení.");
    
    // Počkáme na inicializaci Firebase
    if (typeof window.initializeFirebaseAppAudio === 'function') {
        try {
            await window.initializeFirebaseAppAudio();
            const syncResult = await window.syncButtonVisibilityWithFirestore();
            
            if (syncResult.success && syncResult.config) {
                // Aplikujeme nově načtenou konfiguraci
                if (window.ButtonVisibilityManager && typeof window.ButtonVisibilityManager.setConfig === 'function') {
                    window.ButtonVisibilityManager.setConfig(syncResult.config);
                    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Konfigurace viditelnosti aplikována po synchronizaci.");
                }
            }
            
            if (window.showNotification && syncResult.message) {
                window.showNotification(`Synchronizace viditelnosti: ${syncResult.message}`, 'info', 3000);
            }
            
        } catch (error) {
            console.error("audioFirebaseFunctions.js: Chyba při automatické synchronizaci:", error);
        }
    }
};

// --- AKTUALIZACE clearAllAudioFirestoreData FUNKCE ---

// Rozšíříme existující funkci pro mazání všech dat o konfiguraci viditelnosti
const originalClearAllAudioFirestoreDataWithVisibility = window.clearAllAudioFirestoreData;

window.clearAllAudioFirestoreData = async function() {
    if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Pokus o smazání VŠECH dat včetně konfigurace viditelnosti tlačítek.");
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze smazat všechna data.");
        window.showNotification("Chyba: Databáze není připravena k mazání všech dat!", 'error');
        throw new Error("Firestore databáze není připravena ke smazání všech dat.");
    }

    try {
        // Nejdříve zavoláme původní funkci
        if (originalClearAllAudioFirestoreDataWithVisibility) {
            await originalClearAllAudioFirestoreDataWithVisibility();
        } else {
            // Fallback - smažeme hlavní kolekce
            const collectionsToClean = ['audioPlaylists', 'audioPlayerSettings'];
            for (const collectionName of collectionsToClean) {
                const collectionRef = db.collection(collectionName);
                const snapshot = await collectionRef.get();
                const batch = db.batch();
                
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                if (snapshot.docs.length > 0) {
                    await batch.commit();
                    if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Smazáno ${snapshot.docs.length} dokumentů z kolekce '${collectionName}'.`);
                }
            }
        }
        
        // Poté smažeme zálohy konfigurace viditelnosti
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Mažu zálohy konfigurace viditelnosti...");
        const visibilityBackupsRef = db.collection('audioPlayerSettings')
            .doc('backups')
            .collection('buttonVisibilityBackups');
        const visibilitySnapshot = await visibilityBackupsRef.get();
        
        const visibilityBatch = db.batch();
        let deletedVisibilityBackups = 0;
        
        visibilitySnapshot.docs.forEach(doc => {
            visibilityBatch.delete(doc.ref);
            deletedVisibilityBackups++;
        });
        
        if (deletedVisibilityBackups > 0) {
            await visibilityBatch.commit();
            if (DEBUG_COLOUDE_FIRESTORE) console.log(`audioFirebaseFunctions.js: Smazáno ${deletedVisibilityBackups} záloh konfigurace viditelnosti.`);
        }
        
        if (DEBUG_COLOUDE_FIRESTORE) console.log("audioFirebaseFunctions.js: Všechna data audio přehrávače včetně konfigurace viditelnosti úspěšně smazána.");
        
        // Vyčistíme také localStorage
        localStorage.removeItem('buttonVisibility');
        localStorage.removeItem('buttonVisibilityLastModified');
        
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při mazání všech dat z Firestore:", error);
        window.showNotification("Chyba při mazání všech dat z cloudu!", 'error');
        throw error;
    }
};

// --- DEBUGGING FUNKCE ---

// Debug funkce pro testování konfigurace viditelnosti
window.debugButtonVisibilityFirestore = async function() {
    if (!db) {
        if (DEBUG_COLOUDE_FIRESTORE) console.log("DEBUG VISIBILITY: Firestore databáze není inicializována.");
        return;
    }
    
    try {
        if (DEBUG_COLOUDE_FIRESTORE) console.log("=== DEBUG: Button Visibility Firestore ===");
        
        // Načteme aktuální konfiguraci
        const config = await window.loadButtonVisibilityFromFirestore();
        if (DEBUG_COLOUDE_FIRESTORE) console.log("Aktuální konfigurace viditelnosti:", config);
        
        // Načteme seznam záloh
        const backups = await window.listButtonVisibilityBackups();
        if (DEBUG_COLOUDE_FIRESTORE) console.log("Dostupné zálohy konfigurace viditelnosti:", backups);
        
        // Informace o dokumentech
        const doc = await db.collection('audioPlayerSettings').doc('buttonVisibilityConfig').get();
        if (DEBUG_COLOUDE_FIRESTORE) console.log("Dokument konfigurace existuje:", doc.exists);
        if (doc.exists) {
            if (DEBUG_COLOUDE_FIRESTORE) console.log("Velikost dokumentu (přibližně):", JSON.stringify(doc.data()).length, "znaků");
            if (DEBUG_COLOUDE_FIRESTORE) console.log("Metadata dokumentu:", doc.data().lastUpdated?.toDate?.(), doc.data().version);
        }
        
        // Test synchronizace
        const syncResult = await window.syncButtonVisibilityWithFirestore();
        if (DEBUG_COLOUDE_FIRESTORE) console.log("Test synchronizace:", syncResult);
        
        if (DEBUG_COLOUDE_FIRESTORE) console.log("=== END DEBUG VISIBILITY ===");
        
        return {
            config,
            backups,
            documentExists: doc.exists,
            syncResult
        };
    } catch (error) {
        console.error("DEBUG VISIBILITY: Chyba při ladění:", error);
        return { error: error.message };
    }
};

// --- INICIALIZACE PO NAČTENÍ ---

// Automatická inicializace po načtení Firebase
if (typeof window !== 'undefined') {
    // Počkáme na načtení Firebase a pak spustíme auto-sync
    const checkFirebaseAndSync = setInterval(() => {
        if (window.db || (typeof firebase !== 'undefined' && firebase.apps?.length > 0)) {
            clearInterval(checkFirebaseAndSync);
            setTimeout(() => {
                window.autoSyncButtonVisibilityOnLoad();
            }, 2000); // Dáme čas na inicializaci ostatních komponent
        }
    }, 1000);
    
    // Fallback - pokud se Firebase neinicializuje do 30 sekund, přestaneme čekat
    setTimeout(() => {
        clearInterval(checkFirebaseAndSync);
    }, 30000);
}

if (DEBUG_COLOUDE_FIRESTORE) console.log("🖖 Firebase rozšíření pro správu viditelnosti tlačítek načteno a připraveno!");

// --- EXPORT FUNKCÍ ---
window.ButtonVisibilityFirebaseManager = {
    save: window.saveButtonVisibilityToFirestore,
    load: window.loadButtonVisibilityFromFirestore,
    backup: window.backupButtonVisibilityToFirestore,
    restore: window.restoreButtonVisibilityFromBackup,
    listBackups: window.listButtonVisibilityBackups,
    deleteBackup: window.deleteButtonVisibilityBackup,
    clear: window.clearButtonVisibilityFromFirestore,
    sync: window.syncButtonVisibilityWithFirestore,
    autoSync: window.autoSyncButtonVisibilityOnLoad,
    debug: window.debugButtonVisibilityFirestore
};

 

 

})(); // KONEC IIFE - Vše je izolované