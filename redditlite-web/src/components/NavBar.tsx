import React from 'react'
import { Box, Button, Flex, Link } from '@chakra-ui/react';
import NextLink from "next/link";
import { useMeQuery } from '../generated/graphql';

interface NavBarProps {

}

export const NavBar: React.FC<NavBarProps> = ({ }) => {
    const [{ data, fetching }] = useMeQuery();
    let body;

    // data loading
    if (fetching) {

        // user not logged in
    } else if (!data?.me) {
        body = (
            <>
                <NextLink href="/login">
                    <Link color='white' mr="4">Login</Link>
                </NextLink>
                <NextLink href="/register">
                    <Link color='white' mr="4">Register</Link>
                </NextLink>
            </>
        );
    }
    // user logged in
    else {
        body = (
            <Box>
                <Box>
                    {data.me.username}
                    <Button padding={1} mr={2} variant='link'>Logout</Button>
                </Box>
            </Box>
        )
    }

    console.log("cookie being stored?");
    console.log(data?.me);

    return (
        <Flex p={4} bg="tomato">
            <Box ml={'auto'}>
                {body}
            </Box>
        </Flex>
    );
}