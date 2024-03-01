import React from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingPage.module.css';

export default function LandingPage() {
    return (
        <div className={styles.container}>
            <h1>¿Qué país visitarás?</h1>
            <Link to='/home'>
                <button>Inicio</button>
            </Link>
        </div>
    )
}