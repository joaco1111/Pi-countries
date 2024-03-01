const { Router } = require('express');
const axios = require('axios');
const { Country, Activity } = require('../db');

const router = Router();

const getCountriesInfoFromApi = async () => {
    try {
        const countriesApiUrl = await axios.get('https://restcountries.com/v3/all');
        const countriesApiInfo = await countriesApiUrl.data.map(el => {
            return {
                id: el.cca3,
                name: el.name.common,
                img: el.flags[1],
                continent: el.continents[0],
                capital: el.capital ? el.capital[0] : 'No existe Capital',
                subregion: el.subregion ? el.subregion : 'No existe Subregión',
                area: el.area,
                population: el.population
            };
        });

        const countriesDbInfo = await Country.bulkCreate(countriesApiInfo);
        return countriesDbInfo;
    } catch (error) { 
        console.error(error);
        return { error };
    }
};

getCountriesInfoFromApi();

async function getCountriesInfoFromDb() {
    try {
        const countries = await Country.findAll({
            include: {
                model: Activity,
                attributes: ['name', 'difficulty', 'duration', 'season'],
                through: {
                    attributes: []
                }
            }
        });
        return countries;
    } catch (error) { 
        console.error(error); 
        return { error };
    }
}

router.get('/countries', async (req, res) => {
    const { name } = req.query;
    try {
        const totalCountries = await getCountriesInfoFromDb();
        if (name) {
            let countryName = await totalCountries
                .filter(el => el.name
                    .toLowerCase()
                    .includes(name.toLowerCase()));

            countryName.length ?
                res.status(200).send(countryName) :
                res.status(404).send('No se encuentra el país.');
        } else {
            res.status(200).send(totalCountries);
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/activity', async (req, res) => {
    try {
        const findActivity = await Activity.findAll();
        res.send(findActivity);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

router.delete('/activity/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Activity.destroy({
            where: { id: id }
        });
        res.send('Actividad eliminada');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

router.post('/activity', async (req, res) => {
    const {
        name,
        difficulty,
        duration,
        season,
        countryId } = req.body;

    try {
        let [activityMatch, created] = await Activity.findOrCreate({
            where: { name: name },
            defaults: {
                name: name,
                difficulty: difficulty,
                duration: duration,
                season: season
            }
        });

        const countrySelectedByActivity = await Country.findAll({ where: { id: countryId } });

        for (let value of countrySelectedByActivity) {
            await value.addActivity(activityMatch.dataValues.id);
        }

        res.status(200).send('¡Actividad creada con éxito!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

router.get('/countries/:countryId', async (req, res) => {
    try {
        const { countryId } = req.params;
        const getCountryById = await Country.findByPk(
            countryId.toUpperCase(),
            {
                include: {
                    model: Activity,
                    attributes: ['name', 'difficulty', 'duration', 'season'],
                    through: {
                        attributes: []
                    }
                }
            }
        );
        getCountryById ?
            res.json(getCountryById) :
            res.status(404).send('El ID del país ingresado no existe.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor');
    }
});

module.exports = router;
