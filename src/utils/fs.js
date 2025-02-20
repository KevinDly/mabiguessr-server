import FileSystemHandle from 'fs/promises'
import fs from 'fs'

export async function loadDataFromFile(fileLocation) {
    try {
        let fileData = await FileSystemHandle.readFile(fileLocation)
        return JSON.parse(fileData)
    }
    catch (e) {
        console.log(e)
    }
}

export function saveDataToFile(fileLocation, data) {
    const refreshTokenData = {

    }

    try {
        fs.writeFile(fileLocation, JSON.stringify(spotifyDataObject), (err) => {
            if (err) throw err;
            console.log(`Saved file to ${fileLocation}`)
        })
    }
    catch (e) {
        console.error(e)
    }
}