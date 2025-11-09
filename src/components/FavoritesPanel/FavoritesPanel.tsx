import styles from "./favoritespanel.module.scss";

export interface FavoriteItem {
    type: string;
    emoji: string;
    value: string;
}

export interface IFavoritesPanelProps {
    favorites: FavoriteItem[];
}

export const FavoritesPanel = (props: IFavoritesPanelProps) => {
    return (
        <div className={`windowContent`}>
          <ul className={styles.favoritesList}>
            {
                props.favorites.map((favorite) => (
                    <li key={favorite.type}>{favorite.emoji} <strong>{favorite.type}:</strong> {favorite.value}</li>
                ))
            }
          </ul>
        </div>
    );
};