// components/game/ActiveCard.tsx
import { StyleSheet, View, Dimensions, Text } from 'react-native';
import Icons from '../../assets/icons';

type ActiveCardProps = {
    card: number[];
};

const MAX_WIDTH = Math.min(Dimensions.get('window').width - 40, 360);

export default function ActiveCard({ card }: ActiveCardProps) {
    // simple responsive grid: 2–4 columns based on icon count
    const count = card.length || 4;
    const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(count))));
    const cellSize = Math.floor((MAX_WIDTH - (cols - 1) * 10) / cols);
    const iconHeight = Math.max(48, Math.min(80, Math.round(cellSize * 0.9)));

    return (
        <View style={[styles.grid, { width: MAX_WIDTH }]}>
            {card.map((icon) => {
                const Icon = (Icons as Record<string, React.ComponentType<any>>)[`Icon${icon}`];
                return (
                    <View key={`active-${icon}`} style={[styles.cell, { width: cellSize, height: cellSize }]}>
                        {Icon ? (
                            <Icon width={Math.round(cellSize * 0.85)} height={iconHeight} />
                        ) : (
                            <Text style={styles.missing}>?</Text>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    cell: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
    },
    missing: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'red',
    },
});
