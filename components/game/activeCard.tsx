import { StyleSheet, View, Dimensions, Text } from 'react-native';
import Icons from '../../assets/icons';

type ActiveCardProps = {
    card: number[];
};

const iconWidth = (Dimensions.get('window').width - 60) / 6;

export default function ActiveCard({ card }: ActiveCardProps) {
    return (
        <View style={styles.icons}>
            {card.map((icon) => {
                const Icon = (Icons as Record<string, React.ComponentType<any>>)[`Icon${icon}`];

                return (
                    <View key={`active-card-${icon}`} style={styles.icon}>
                        {Icon ? <Icon width={iconWidth} height={60} /> : <Text style={styles.missing}>?</Text>}
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    icons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
    },
    icon: {
        width: iconWidth,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    missing: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'red',
    },
});
